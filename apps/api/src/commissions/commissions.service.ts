import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Commission, CommissionListQuery, CommissionsSummary, MarkCommissionReceivedRequest } from "@spire/contracts";
import { and, eq, gte } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { brokers, commissions, leads, properties, users } from "../database/schema";
import { SettingsService } from "../settings/settings.service";

import { toCommission } from "./commission-mapper";

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}
function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

export interface WonLeadForCommission {
  id: string;
  userId: string;
  assignedBrokerId: string | null;
  sourcePropertyId: string | null;
}

@Injectable()
export class CommissionsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly settings: SettingsService,
  ) {}

  /**
   * Chamada pelo LeadsService quando um lead vira GANHO. `baseAmount`/`rate`
   * são um retrato do momento — mudar a comissão padrão depois (D5) nunca
   * altera comissões já geradas.
   */
  async createForWonLead(lead: WonLeadForCommission, wonAmount: number): Promise<void> {
    const rate = await this.settings.getCommissionRate();
    const previstoAmount = Math.round(wonAmount * rate * 100) / 100;

    await this.db.insert(commissions).values({
      leadId: lead.id,
      brokerId: lead.assignedBrokerId,
      propertyId: lead.sourcePropertyId,
      baseAmount: wonAmount.toFixed(2),
      rate: rate.toFixed(4),
      previstoAmount: previstoAmount.toFixed(2),
      status: "PREVISTO",
    });
  }

  private rowsQuery() {
    return this.db
      .select({ commission: commissions, buyer: users, broker: brokers, property: properties })
      .from(commissions)
      .innerJoin(leads, eq(leads.id, commissions.leadId))
      .innerJoin(users, eq(users.id, leads.userId))
      .leftJoin(brokers, eq(brokers.id, commissions.brokerId))
      .leftJoin(properties, eq(properties.id, commissions.propertyId));
  }

  async list(query: CommissionListQuery): Promise<{ items: Commission[]; nextCursor: string | null }> {
    const offset = decodeCursor(query.cursor);
    const conditions = [];
    if (query.status) conditions.push(eq(commissions.status, query.status));
    if (query.brokerId) conditions.push(eq(commissions.brokerId, query.brokerId));

    const rows = await this.rowsQuery()
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(commissions.createdAt)
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items: pageRows.map((r) => toCommission(r.commission, r.buyer, r.broker, r.property)),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async markReceived(id: string, request: MarkCommissionReceivedRequest): Promise<Commission> {
    const [current] = await this.db.select().from(commissions).where(eq(commissions.id, id)).limit(1);
    if (!current) throw new NotFoundException({ code: "COMMISSION_NOT_FOUND", message: "Comissão não encontrada" });

    const [row] = await this.db
      .update(commissions)
      .set({
        status: "RECEBIDO",
        recebidoAmount: request.recebidoAmount.toFixed(2),
        recebidoAt: request.recebidoAt ? new Date(request.recebidoAt) : new Date(),
        updatedAt: new Date(),
      })
      .where(eq(commissions.id, id))
      .returning();
    if (!row) throw new Error("Falha ao marcar comissão como recebida");

    const [buyerRow] = await this.db
      .select({ buyer: users })
      .from(leads)
      .innerJoin(users, eq(users.id, leads.userId))
      .where(eq(leads.id, row.leadId))
      .limit(1);
    const broker = row.brokerId ? (await this.db.select().from(brokers).where(eq(brokers.id, row.brokerId)).limit(1))[0] ?? null : null;
    const property = row.propertyId ? (await this.db.select().from(properties).where(eq(properties.id, row.propertyId)).limit(1))[0] ?? null : null;

    return toCommission(row, buyerRow!.buyer, broker, property);
  }

  /** Nunca mistura VGV com comissão (prevista ou recebida) — seção 4.9/11.10 do prompt mestre. */
  async summary(days: number): Promise<CommissionsSummary> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.db.select().from(commissions).where(gte(commissions.createdAt, since));

    const previsto = rows.filter((r) => r.status !== "CANCELADO");
    const recebido = rows.filter((r) => r.status === "RECEBIDO");

    return {
      vgv: rows.reduce((sum, r) => sum + Number(r.baseAmount), 0),
      previstoTotal: previsto.reduce((sum, r) => sum + Number(r.previstoAmount), 0),
      recebidoTotal: recebido.reduce((sum, r) => sum + Number(r.recebidoAmount ?? 0), 0),
      previstoCount: previsto.length,
      recebidoCount: recebido.length,
    };
  }
}
