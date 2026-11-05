import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateIntegrationConnectionRequest, IntegrationConnection, UpdateIntegrationConnectionRequest } from "@spire/contracts";
import { eq, inArray } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { integrationConnections, integrationEvents } from "../database/schema";

function toConnection(
  row: typeof integrationConnections.$inferSelect,
  counts: { pending: number; failed: number },
): IntegrationConnection {
  return {
    id: row.id,
    provider: row.provider,
    label: row.label,
    direction: row.direction,
    status: row.status,
    config: row.config as Record<string, unknown>,
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? null,
    lastErrorAt: row.lastErrorAt?.toISOString() ?? null,
    lastErrorMessage: row.lastErrorMessage,
    pendingEventsCount: counts.pending,
    failedEventsCount: counts.failed,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class IntegrationConnectionsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /**
   * Conta pendências/falhas por conexão num único round-trip e reduz em JS
   * (volume esperado é baixo nesta fundação) — mesmo estilo de
   * `ReportsService.vgvReport`, sem agregação SQL que nada aqui justifica.
   */
  private async countsByConnection(connectionIds: string[]): Promise<Map<string, { pending: number; failed: number }>> {
    const result = new Map<string, { pending: number; failed: number }>();
    if (connectionIds.length === 0) return result;

    const rows = await this.db
      .select({ connectionId: integrationEvents.connectionId, status: integrationEvents.status })
      .from(integrationEvents)
      .where(inArray(integrationEvents.connectionId, connectionIds));

    for (const row of rows) {
      const entry = result.get(row.connectionId) ?? { pending: 0, failed: 0 };
      if (row.status === "PENDENTE") entry.pending += 1;
      if (row.status === "FALHOU") entry.failed += 1;
      result.set(row.connectionId, entry);
    }
    return result;
  }

  async list(): Promise<IntegrationConnection[]> {
    const rows = await this.db.select().from(integrationConnections).orderBy(integrationConnections.createdAt);
    const counts = await this.countsByConnection(rows.map((r) => r.id));
    return rows.map((row) => toConnection(row, counts.get(row.id) ?? { pending: 0, failed: 0 }));
  }

  async getOrThrow(id: string): Promise<typeof integrationConnections.$inferSelect> {
    const [row] = await this.db.select().from(integrationConnections).where(eq(integrationConnections.id, id)).limit(1);
    if (!row) throw new NotFoundException({ code: "INTEGRATION_CONNECTION_NOT_FOUND", message: "Conexão não encontrada" });
    return row;
  }

  async create(request: CreateIntegrationConnectionRequest, userId: string): Promise<IntegrationConnection> {
    const [row] = await this.db
      .insert(integrationConnections)
      .values({
        provider: request.provider,
        label: request.label,
        direction: request.direction,
        config: request.config,
        updatedByUserId: userId,
      })
      .returning();
    return toConnection(row!, { pending: 0, failed: 0 });
  }

  async update(id: string, request: UpdateIntegrationConnectionRequest, userId: string): Promise<IntegrationConnection> {
    await this.getOrThrow(id);
    const [row] = await this.db
      .update(integrationConnections)
      .set({
        ...(request.label !== undefined ? { label: request.label } : {}),
        ...(request.config !== undefined ? { config: request.config } : {}),
        updatedAt: new Date(),
        updatedByUserId: userId,
      })
      .where(eq(integrationConnections.id, id))
      .returning();
    const counts = await this.countsByConnection([id]);
    return toConnection(row!, counts.get(id) ?? { pending: 0, failed: 0 });
  }

  /**
   * Ativar não valida credencial nenhuma (M1 é provider-agnóstico) — só
   * destrava o status para que um conector concreto (M2+) possa operar.
   * Nunca finge ter testado uma conexão real que ninguém configurou ainda.
   */
  async activate(id: string, userId: string): Promise<IntegrationConnection> {
    await this.getOrThrow(id);
    const [row] = await this.db
      .update(integrationConnections)
      .set({ status: "ATIVA", updatedAt: new Date(), updatedByUserId: userId })
      .where(eq(integrationConnections.id, id))
      .returning();
    const counts = await this.countsByConnection([id]);
    return toConnection(row!, counts.get(id) ?? { pending: 0, failed: 0 });
  }

  async pause(id: string, userId: string): Promise<IntegrationConnection> {
    await this.getOrThrow(id);
    const [row] = await this.db
      .update(integrationConnections)
      .set({ status: "PAUSADA", updatedAt: new Date(), updatedByUserId: userId })
      .where(eq(integrationConnections.id, id))
      .returning();
    const counts = await this.countsByConnection([id]);
    return toConnection(row!, counts.get(id) ?? { pending: 0, failed: 0 });
  }

  async recordError(id: string, message: string): Promise<void> {
    await this.db
      .update(integrationConnections)
      .set({ lastErrorAt: new Date(), lastErrorMessage: message.slice(0, 500) })
      .where(eq(integrationConnections.id, id));
  }

  async recordSync(id: string): Promise<void> {
    await this.db.update(integrationConnections).set({ lastSyncedAt: new Date() }).where(eq(integrationConnections.id, id));
  }
}
