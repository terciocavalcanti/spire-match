import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import type {
  AssignLeadRequest,
  Lead,
  LeadActivityType,
  LeadDetail,
  LeadListQuery,
  LeadStage,
  UpdateLeadStageRequest,
} from "@spire/contracts";
import { computeLeadScore } from "@spire/domain";
import { and, desc, eq, gte, ne } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import {
  brokers,
  contacts,
  favorites,
  leadActivities,
  leads,
  properties,
  proposals,
  userInteractions,
  users,
  visits,
} from "../database/schema";

import { toLead, toLeadActivity } from "./lead-mapper";

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}
function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

// Ordem do funil para avanço automático monotônico — nunca regride e nunca
// entra sozinho em GANHO/PERDIDO (sempre decisão humana via updateStage).
const STAGE_ORDER: Record<LeadStage, number> = {
  NOVO: 0,
  QUALIFICANDO: 1,
  INTERESSE: 2,
  VISITA: 3,
  PROPOSTA: 4,
  NEGOCIACAO: 5,
  GANHO: 6,
  PERDIDO: 6,
};

const AUTO_ADVANCE_TARGET: Partial<Record<LeadActivityType, LeadStage>> = {
  CONTACT: "INTERESSE",
  VISIT_SCHEDULED: "VISITA",
  PROPOSAL_RECEIVED: "PROPOSTA",
};

@Injectable()
export class LeadsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  /** Cria o lead na primeira ação comercial do comprador, ou retorna o existente. */
  private async ensureLead(userId: string, sourcePropertyId?: string): Promise<typeof leads.$inferSelect> {
    const [existing] = await this.db.select().from(leads).where(eq(leads.userId, userId)).limit(1);
    if (existing) return existing;

    const [created] = await this.db
      .insert(leads)
      .values({ userId, sourcePropertyId: sourcePropertyId ?? null })
      .onConflictDoNothing({ target: leads.userId })
      .returning();

    if (created) {
      await this.db.insert(leadActivities).values({
        leadId: created.id,
        type: "CREATED",
        description: "Lead criado a partir da primeira ação comercial do comprador.",
      });
      return created;
    }

    // Corrida rara: outra requisição criou o lead entre o select e o insert.
    const [raced] = await this.db.select().from(leads).where(eq(leads.userId, userId)).limit(1);
    if (!raced) throw new Error("Falha ao criar lead");
    return raced;
  }

  private async countSignals(userId: string) {
    const [views, favs, contactRows, visitRows, proposalRows] = await Promise.all([
      this.db.select({ id: userInteractions.id }).from(userInteractions).where(and(eq(userInteractions.userId, userId), eq(userInteractions.type, "VIEW"))),
      this.db.select({ id: favorites.id }).from(favorites).where(eq(favorites.userId, userId)),
      this.db.select({ id: contacts.id }).from(contacts).where(eq(contacts.userId, userId)),
      this.db.select({ id: visits.id }).from(visits).where(and(eq(visits.userId, userId), ne(visits.status, "CANCELLED"))),
      this.db.select({ id: proposals.id }).from(proposals).where(eq(proposals.userId, userId)),
    ]);
    return {
      viewsCount: views.length,
      favoritesCount: favs.length,
      hasContact: contactRows.length > 0,
      hasScheduledVisit: visitRows.length > 0,
      hasProposal: proposalRows.length > 0,
    };
  }

  /**
   * Chamado pelos módulos de Contacts/Visits/Proposals a cada ação comercial
   * real do comprador: garante o lead, registra a atividade, recalcula o
   * score a partir dos sinais reais e avança o estágio (nunca regride, nunca
   * entra sozinho em Ganho/Perdido).
   */
  async recordSignal(userId: string, type: LeadActivityType, description: string, sourcePropertyId?: string): Promise<void> {
    const lead = await this.ensureLead(userId, sourcePropertyId);

    await this.db.insert(leadActivities).values({ leadId: lead.id, type, description });

    const signals = await this.countSignals(userId);
    const { score } = computeLeadScore(signals);

    const target = AUTO_ADVANCE_TARGET[type];
    const nextStage =
      target && STAGE_ORDER[target] > STAGE_ORDER[lead.stage] ? target : lead.stage;

    await this.db
      .update(leads)
      .set({ score, stage: nextStage, updatedAt: new Date() })
      .where(eq(leads.id, lead.id));
  }

  async list(query: LeadListQuery): Promise<{ items: Lead[]; nextCursor: string | null }> {
    const offset = decodeCursor(query.cursor);
    const conditions = [];
    if (query.stage) conditions.push(eq(leads.stage, query.stage));
    if (query.assignedBrokerId) conditions.push(eq(leads.assignedBrokerId, query.assignedBrokerId));

    const rows = await this.db
      .select({ lead: leads, buyer: users, sourceProperty: properties, assignedBroker: brokers })
      .from(leads)
      .innerJoin(users, eq(users.id, leads.userId))
      .leftJoin(properties, eq(properties.id, leads.sourcePropertyId))
      .leftJoin(brokers, eq(brokers.id, leads.assignedBrokerId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(leads.score), desc(leads.updatedAt))
      .limit(query.limit + 1)
      .offset(offset);

    const filtered = query.q
      ? rows.filter(
          (r) =>
            r.buyer.name.toLowerCase().includes(query.q!.toLowerCase()) ||
            r.buyer.email.toLowerCase().includes(query.q!.toLowerCase()),
        )
      : rows;

    const hasMore = filtered.length > query.limit;
    const pageRows = hasMore ? filtered.slice(0, query.limit) : filtered;

    return {
      items: pageRows.map((r) => toLead(r.lead, r.buyer, r.sourceProperty, r.assignedBroker)),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async getDetail(leadId: string): Promise<LeadDetail> {
    const [row] = await this.db
      .select({ lead: leads, buyer: users, sourceProperty: properties, assignedBroker: brokers })
      .from(leads)
      .innerJoin(users, eq(users.id, leads.userId))
      .leftJoin(properties, eq(properties.id, leads.sourcePropertyId))
      .leftJoin(brokers, eq(brokers.id, leads.assignedBrokerId))
      .where(eq(leads.id, leadId))
      .limit(1);
    if (!row) throw new NotFoundException({ code: "LEAD_NOT_FOUND", message: "Lead não encontrado" });

    const activityRows = await this.db
      .select()
      .from(leadActivities)
      .where(eq(leadActivities.leadId, leadId))
      .orderBy(desc(leadActivities.createdAt));

    return {
      ...toLead(row.lead, row.buyer, row.sourceProperty, row.assignedBroker),
      activities: activityRows.map(toLeadActivity),
    };
  }

  async updateStage(leadId: string, request: UpdateLeadStageRequest): Promise<LeadDetail> {
    const [lead] = await this.db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) throw new NotFoundException({ code: "LEAD_NOT_FOUND", message: "Lead não encontrado" });

    if (request.stage === "PERDIDO" && !request.lostReason) {
      throw new UnprocessableEntityException({ code: "LOST_REASON_REQUIRED", message: "Informe o motivo da perda" });
    }

    await this.db
      .update(leads)
      .set({
        stage: request.stage,
        wonAmount: request.stage === "GANHO" && request.wonAmount !== undefined ? request.wonAmount.toFixed(2) : lead.wonAmount,
        lostReason: request.stage === "PERDIDO" ? (request.lostReason ?? null) : lead.lostReason,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    await this.db.insert(leadActivities).values({
      leadId,
      type: "STAGE_CHANGED",
      description: `Estágio alterado de ${lead.stage} para ${request.stage}${request.lostReason ? ` — motivo: ${request.lostReason}` : ""}`,
    });

    return this.getDetail(leadId);
  }

  async assign(leadId: string, request: AssignLeadRequest): Promise<LeadDetail> {
    const [lead] = await this.db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) throw new NotFoundException({ code: "LEAD_NOT_FOUND", message: "Lead não encontrado" });

    let brokerName = "ninguém";
    if (request.brokerId) {
      const [broker] = await this.db.select({ name: brokers.name }).from(brokers).where(eq(brokers.id, request.brokerId)).limit(1);
      if (!broker) throw new NotFoundException({ code: "BROKER_NOT_FOUND", message: "Corretor não encontrado" });
      brokerName = broker.name;
    }

    await this.db.update(leads).set({ assignedBrokerId: request.brokerId, updatedAt: new Date() }).where(eq(leads.id, leadId));
    await this.db.insert(leadActivities).values({ leadId, type: "ASSIGNED", description: `Lead atribuído a ${brokerName}` });

    return this.getDetail(leadId);
  }

  async addNote(leadId: string, note: string): Promise<LeadDetail> {
    const [lead] = await this.db.select({ id: leads.id }).from(leads).where(eq(leads.id, leadId)).limit(1);
    if (!lead) throw new NotFoundException({ code: "LEAD_NOT_FOUND", message: "Lead não encontrado" });

    await this.db.insert(leadActivities).values({ leadId, type: "NOTE", description: note });
    return this.getDetail(leadId);
  }

  async overview() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [allLeads, newLast7, visitsLast7, wonLast30] = await Promise.all([
      this.db.select({ stage: leads.stage, score: leads.score }).from(leads),
      this.db.select({ id: leads.id }).from(leads).where(gte(leads.createdAt, sevenDaysAgo)),
      this.db.select({ id: visits.id }).from(visits).where(and(gte(visits.createdAt, sevenDaysAgo), ne(visits.status, "CANCELLED"))),
      this.db.select({ wonAmount: leads.wonAmount }).from(leads).where(and(eq(leads.stage, "GANHO"), gte(leads.updatedAt, thirtyDaysAgo))),
    ]);

    const stageOrder: LeadStage[] = ["NOVO", "QUALIFICANDO", "INTERESSE", "VISITA", "PROPOSTA", "NEGOCIACAO", "GANHO", "PERDIDO"];
    const leadsByStage = stageOrder.map((stage) => ({ stage, count: allLeads.filter((l) => l.stage === stage).length }));

    return {
      newLeadsLast7Days: newLast7.length,
      hotLeadsCount: allLeads.filter((l) => l.score >= 60).length,
      visitsScheduledLast7Days: visitsLast7.length,
      wonLeadsLast30Days: wonLast30.length,
      vgvLast30Days: wonLast30.reduce((sum, l) => sum + (l.wonAmount ? Number(l.wonAmount) : 0), 0),
      leadsByStage,
    };
  }

  async funnelReport(days: number) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.db
      .select({ stage: leads.stage, wonAmount: leads.wonAmount })
      .from(leads)
      .where(gte(leads.createdAt, since));

    const stageOrder: LeadStage[] = ["NOVO", "QUALIFICANDO", "INTERESSE", "VISITA", "PROPOSTA", "NEGOCIACAO", "GANHO", "PERDIDO"];
    const leadsByStage = stageOrder.map((stage) => ({ stage, count: rows.filter((l) => l.stage === stage).length }));

    const wonCount = rows.filter((l) => l.stage === "GANHO").length;
    const lostCount = rows.filter((l) => l.stage === "PERDIDO").length;
    const closedCount = wonCount + lostCount;
    const conversionRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;
    const vgv = rows.filter((l) => l.stage === "GANHO").reduce((sum, l) => sum + (l.wonAmount ? Number(l.wonAmount) : 0), 0);

    return { leadsByStage, conversionRate, vgv, wonCount, lostCount };
  }
}
