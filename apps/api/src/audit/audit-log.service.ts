import { Inject, Injectable, Logger } from "@nestjs/common";
import type { AuditLog, AuditLogListQuery } from "@spire/contracts";
import { and, desc, eq, gte, ilike, lte } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { auditLogs, users } from "../database/schema";

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}
function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

function toAuditLog(row: typeof auditLogs.$inferSelect): AuditLog {
  return {
    id: row.id,
    actorUserId: row.actorUserId,
    actorEmail: row.actorEmail,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    metadata: row.metadata,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt.toISOString(),
  };
}

export interface RecordAuditLogParams {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Trilha de auditoria de ações privilegiadas (Marco F) — cobre um conjunto
 * delimitado e justificado (ver chamadas a `record` nos serviços
 * instrumentados), nunca todo CRUD da API. Nunca deixa uma falha de
 * auditoria quebrar a ação principal que está sendo auditada — mesma
 * filosofia de "melhor esforço" do QueueService (Marco C).
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async record(params: RecordAuditLogParams): Promise<void> {
    try {
      let actorEmail: string | null = null;
      if (params.actorUserId) {
        const [actor] = await this.db.select({ email: users.email }).from(users).where(eq(users.id, params.actorUserId)).limit(1);
        actorEmail = actor?.email ?? null;
      }

      await this.db.insert(auditLogs).values({
        actorUserId: params.actorUserId,
        actorEmail,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId ?? null,
        metadata: params.metadata ?? null,
      });
    } catch (err) {
      this.logger.error(`Falha ao registrar auditoria (${params.action}): ${(err as Error).message}`);
    }
  }

  async list(query: AuditLogListQuery): Promise<{ items: AuditLog[]; nextCursor: string | null }> {
    const offset = decodeCursor(query.cursor);
    const conditions = [];
    if (query.action) conditions.push(ilike(auditLogs.action, `%${query.action}%`));
    if (query.entityType) conditions.push(eq(auditLogs.entityType, query.entityType));
    if (query.actorUserId) conditions.push(eq(auditLogs.actorUserId, query.actorUserId));
    if (query.from) conditions.push(gte(auditLogs.createdAt, new Date(query.from)));
    if (query.to) conditions.push(lte(auditLogs.createdAt, new Date(query.to)));

    const rows = await this.db
      .select()
      .from(auditLogs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items: pageRows.map(toAuditLog),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }
}
