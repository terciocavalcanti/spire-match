import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateProposalRequest, Proposal } from "@spire/contracts";
import { desc, eq } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { properties, proposals } from "../database/schema";
import { LeadsService } from "../leads/leads.service";
import { NotificationsService } from "../notifications/notifications.service";

import { toProposal } from "./proposal-mapper";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

@Injectable()
export class ProposalsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly notifications: NotificationsService,
    private readonly leads: LeadsService,
  ) {}

  async create(userId: string, request: CreateProposalRequest): Promise<Proposal> {
    const [property] = await this.db.select().from(properties).where(eq(properties.id, request.propertyId)).limit(1);
    if (!property) throw new NotFoundException({ code: "PROPERTY_NOT_FOUND", message: "Imóvel não encontrado" });

    const [row] = await this.db
      .insert(proposals)
      .values({
        userId,
        propertyId: request.propertyId,
        amount: request.amount.toFixed(2),
        paymentMethod: request.paymentMethod,
        message: request.message ?? null,
      })
      .returning();
    if (!row) throw new Error("Falha ao registrar proposta");

    await this.notifications.notify(
      userId,
      "PROPOSAL_UPDATE",
      "Proposta enviada",
      `Sua proposta para ${property.title} foi registrada e está aguardando retorno.`,
      "/minhas-visitas",
    );

    await this.leads.recordSignal(
      userId,
      "PROPOSAL_RECEIVED",
      `Proposta de ${currencyFormatter.format(request.amount)} recebida para ${property.title}.`,
      property.id,
    );

    return toProposal(row, property);
  }

  async listMine(userId: string): Promise<Proposal[]> {
    const rows = await this.db
      .select({ proposal: proposals, property: properties })
      .from(proposals)
      .innerJoin(properties, eq(properties.id, proposals.propertyId))
      .where(eq(proposals.userId, userId))
      .orderBy(desc(proposals.createdAt));

    return rows.map(({ proposal, property }) => toProposal(proposal, property));
  }
}
