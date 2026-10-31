import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import type {
  AssignOwnerLeadRequest,
  CreateOwnerLeadRequest,
  OwnerLead,
  OwnerLeadDetail,
  OwnerLeadListQuery,
  PublishOwnerLeadRequest,
  UpdateOwnerLeadStageRequest,
} from "@spire/contracts";
import { and, desc, eq, ilike, or } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { brokers, ownerLeadActivities, ownerLeads, roleAssignments, roles, users } from "../database/schema";
import { PrivateMarketService } from "../private-market/private-market.service";
import { PropertiesService } from "../properties/properties.service";

import { toOwnerLead, toOwnerLeadActivity } from "./owner-lead-mapper";

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}
function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

@Injectable()
export class OwnerLeadsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly properties: PropertiesService,
    private readonly privateMarket: PrivateMarketService,
  ) {}

  /** Garante que o papel OWNER esteja atribuído — mesmo padrão de AuthService.register atribuindo BUYER no autocadastro. */
  private async ensureOwnerRole(userId: string): Promise<void> {
    const [ownerRole] = await this.db.select().from(roles).where(eq(roles.name, "OWNER")).limit(1);
    if (!ownerRole) return;
    await this.db
      .insert(roleAssignments)
      .values({ userId, roleId: ownerRole.id })
      .onConflictDoNothing({ target: [roleAssignments.userId, roleAssignments.roleId] });
  }

  async create(userId: string, request: CreateOwnerLeadRequest): Promise<OwnerLeadDetail> {
    await this.ensureOwnerRole(userId);

    const [row] = await this.db
      .insert(ownerLeads)
      .values({
        userId,
        intent: request.intent,
        propertyType: request.propertyType,
        neighborhood: request.neighborhood,
        city: request.city,
        state: request.state.toUpperCase(),
        areaSqm: request.areaSqm.toFixed(2),
        bedrooms: request.bedrooms,
        parkingSpaces: request.parkingSpaces,
        askingPrice: request.askingPrice != null ? request.askingPrice.toFixed(2) : null,
        description: request.description,
        consentCaptureAt: new Date(),
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar captação");

    await this.db.insert(ownerLeadActivities).values({
      ownerLeadId: row.id,
      type: "CREATED",
      description: "Captação solicitada pelo proprietário.",
    });

    if (request.privateMarketOptIn) {
      await this.privateMarket.createForOwnerLead(row.id);
    }

    return this.getDetail(row.id);
  }

  async listMine(userId: string): Promise<OwnerLead[]> {
    const rows = await this.db
      .select({ ownerLead: ownerLeads, owner: users, assignedBroker: brokers })
      .from(ownerLeads)
      .innerJoin(users, eq(users.id, ownerLeads.userId))
      .leftJoin(brokers, eq(brokers.id, ownerLeads.assignedBrokerId))
      .where(eq(ownerLeads.userId, userId))
      .orderBy(desc(ownerLeads.createdAt));

    return rows.map((r) => toOwnerLead(r.ownerLead, r.owner, r.assignedBroker));
  }

  async list(query: OwnerLeadListQuery): Promise<{ items: OwnerLead[]; nextCursor: string | null }> {
    const offset = decodeCursor(query.cursor);
    const conditions = [];
    if (query.stage) conditions.push(eq(ownerLeads.stage, query.stage));
    if (query.assignedBrokerId) conditions.push(eq(ownerLeads.assignedBrokerId, query.assignedBrokerId));
    if (query.q) conditions.push(or(ilike(users.name, `%${query.q}%`), ilike(users.email, `%${query.q}%`))!);

    const rows = await this.db
      .select({ ownerLead: ownerLeads, owner: users, assignedBroker: brokers })
      .from(ownerLeads)
      .innerJoin(users, eq(users.id, ownerLeads.userId))
      .leftJoin(brokers, eq(brokers.id, ownerLeads.assignedBrokerId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(ownerLeads.createdAt))
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items: pageRows.map((r) => toOwnerLead(r.ownerLead, r.owner, r.assignedBroker)),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async getDetail(id: string): Promise<OwnerLeadDetail> {
    const [row] = await this.db
      .select({ ownerLead: ownerLeads, owner: users, assignedBroker: brokers })
      .from(ownerLeads)
      .innerJoin(users, eq(users.id, ownerLeads.userId))
      .leftJoin(brokers, eq(brokers.id, ownerLeads.assignedBrokerId))
      .where(eq(ownerLeads.id, id))
      .limit(1);
    if (!row) throw new NotFoundException({ code: "OWNER_LEAD_NOT_FOUND", message: "Captação não encontrada" });

    const activityRows = await this.db
      .select()
      .from(ownerLeadActivities)
      .where(eq(ownerLeadActivities.ownerLeadId, id))
      .orderBy(desc(ownerLeadActivities.createdAt));

    return {
      ...toOwnerLead(row.ownerLead, row.owner, row.assignedBroker),
      activities: activityRows.map(toOwnerLeadActivity),
    };
  }

  async updateStage(id: string, request: UpdateOwnerLeadStageRequest): Promise<OwnerLeadDetail> {
    const [ownerLead] = await this.db.select().from(ownerLeads).where(eq(ownerLeads.id, id)).limit(1);
    if (!ownerLead) throw new NotFoundException({ code: "OWNER_LEAD_NOT_FOUND", message: "Captação não encontrada" });

    if (request.stage === "REJEITADO" && !request.rejectionReason) {
      throw new UnprocessableEntityException({ code: "REJECTION_REASON_REQUIRED", message: "Informe o motivo da rejeição" });
    }
    if (ownerLead.stage === "CONVERTIDO") {
      throw new UnprocessableEntityException({ code: "ALREADY_CONVERTED", message: "Captação já convertida em imóvel, não pode mudar de estágio" });
    }

    await this.db
      .update(ownerLeads)
      .set({
        stage: request.stage,
        rejectionReason: request.stage === "REJEITADO" ? (request.rejectionReason ?? null) : ownerLead.rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(ownerLeads.id, id));

    await this.db.insert(ownerLeadActivities).values({
      ownerLeadId: id,
      type: "STAGE_CHANGED",
      description: `Estágio alterado de ${ownerLead.stage} para ${request.stage}${request.rejectionReason ? ` — motivo: ${request.rejectionReason}` : ""}`,
    });

    return this.getDetail(id);
  }

  async assign(id: string, request: AssignOwnerLeadRequest): Promise<OwnerLeadDetail> {
    const [ownerLead] = await this.db.select().from(ownerLeads).where(eq(ownerLeads.id, id)).limit(1);
    if (!ownerLead) throw new NotFoundException({ code: "OWNER_LEAD_NOT_FOUND", message: "Captação não encontrada" });

    let brokerName = "ninguém";
    if (request.brokerId) {
      const [broker] = await this.db.select({ name: brokers.name }).from(brokers).where(eq(brokers.id, request.brokerId)).limit(1);
      if (!broker) throw new NotFoundException({ code: "BROKER_NOT_FOUND", message: "Corretor não encontrado" });
      brokerName = broker.name;
    }

    await this.db.update(ownerLeads).set({ assignedBrokerId: request.brokerId, updatedAt: new Date() }).where(eq(ownerLeads.id, id));
    await this.db.insert(ownerLeadActivities).values({ ownerLeadId: id, type: "ASSIGNED", description: `Captação atribuída a ${brokerName}` });

    return this.getDetail(id);
  }

  async addNote(id: string, note: string): Promise<OwnerLeadDetail> {
    const [ownerLead] = await this.db.select({ id: ownerLeads.id }).from(ownerLeads).where(eq(ownerLeads.id, id)).limit(1);
    if (!ownerLead) throw new NotFoundException({ code: "OWNER_LEAD_NOT_FOUND", message: "Captação não encontrada" });

    await this.db.insert(ownerLeadActivities).values({ ownerLeadId: id, type: "NOTE", description: note });
    return this.getDetail(id);
  }

  /**
   * Fecha o laço "imóvel privado entra em circuito autorizado": cria um
   * imóvel DRAFT real no catálogo a partir dos dados da captação,
   * reaproveitando 100% o PropertiesService.adminCreate já existente (D2) —
   * mesma geração de slug, histórico de preço e fila de recálculo do Match
   * Engine (Marco C). O admin ainda precisa revisar/editar antes de publicar
   * como AVAILABLE — DRAFT nunca aparece no catálogo público.
   */
  async publish(id: string, request: PublishOwnerLeadRequest): Promise<OwnerLeadDetail> {
    const [ownerLead] = await this.db.select().from(ownerLeads).where(eq(ownerLeads.id, id)).limit(1);
    if (!ownerLead) throw new NotFoundException({ code: "OWNER_LEAD_NOT_FOUND", message: "Captação não encontrada" });
    if (ownerLead.stage !== "APROVADO") {
      throw new UnprocessableEntityException({ code: "NOT_APPROVED", message: "Só é possível publicar captações aprovadas" });
    }

    const price = request.price ?? (ownerLead.askingPrice ? Number(ownerLead.askingPrice) : null);
    if (!price) {
      throw new UnprocessableEntityException({
        code: "PRICE_REQUIRED",
        message: "O proprietário não informou um preço pretendido — informe um preço para publicar",
      });
    }

    const property = await this.properties.adminCreate({
      title: `${ownerLead.propertyType} em ${ownerLead.neighborhood}`,
      description: ownerLead.description,
      type: ownerLead.propertyType,
      purpose: "MORAR",
      status: "DRAFT",
      price,
      areaSqm: Number(ownerLead.areaSqm),
      bedrooms: ownerLead.bedrooms,
      parkingSpaces: ownerLead.parkingSpaces,
      bathrooms: 0,
      neighborhood: ownerLead.neighborhood,
      city: ownerLead.city,
      state: ownerLead.state,
      features: [],
      acceptedPaymentMethods: [],
      isExclusive: false,
      isSponsored: false,
      brokerId: ownerLead.assignedBrokerId,
    });

    await this.db.update(ownerLeads).set({ linkedPropertyId: property.id, stage: "CONVERTIDO", updatedAt: new Date() }).where(eq(ownerLeads.id, id));
    await this.db.insert(ownerLeadActivities).values({
      ownerLeadId: id,
      type: "PUBLISHED",
      description: `Captação publicada no catálogo como rascunho: "${property.title}".`,
    });

    return this.getDetail(id);
  }
}
