import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from "@nestjs/common";
import type {
  PrivateMarketOffer,
  PrivateMarketOfferAdmin,
  PrivateMarketOfferListQuery,
  RequestPrivateMarketContactRequest,
  VerifyPrivateMarketOfferRequest,
} from "@spire/contracts";
import { and, desc, eq, ilike } from "drizzle-orm";

import { AuditLogService } from "../audit/audit-log.service";
import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { ownerLeads, privateMarketConsents, privateMarketContactRequests, privateMarketOffers } from "../database/schema";
import { LeadsService } from "../leads/leads.service";

import { toPrivateMarketOffer, toPrivateMarketOfferAdmin } from "./private-market-mapper";

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}
function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

@Injectable()
export class PrivateMarketService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly leads: LeadsService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Chamado por OwnerLeadsService.create quando o proprietário marca o
   * opt-in de Mercado Privado — cria a oferta (PENDENTE_VERIFICACAO) e o
   * registro legal de consentimento, carimbado pelo servidor.
   */
  async createForOwnerLead(ownerLeadId: string): Promise<void> {
    await this.db.insert(privateMarketOffers).values({ ownerLeadId }).onConflictDoNothing({ target: privateMarketOffers.ownerLeadId });
    await this.db
      .insert(privateMarketConsents)
      .values({ ownerLeadId, consentedAt: new Date() })
      .onConflictDoNothing({ target: privateMarketConsents.ownerLeadId });
  }

  /** Listagem pública — só ofertas ELEGIVEL, sem nada identificável (ver mapper). */
  async list(query: PrivateMarketOfferListQuery): Promise<{ items: PrivateMarketOffer[]; nextCursor: string | null }> {
    const offset = decodeCursor(query.cursor);
    const conditions = [eq(privateMarketOffers.status, "ELEGIVEL")];
    if (query.city) conditions.push(ilike(ownerLeads.city, `%${query.city}%`));

    const rows = await this.db
      .select({ offer: privateMarketOffers, ownerLead: ownerLeads })
      .from(privateMarketOffers)
      .innerJoin(ownerLeads, eq(ownerLeads.id, privateMarketOffers.ownerLeadId))
      .where(and(...conditions))
      .orderBy(desc(privateMarketOffers.verifiedAt))
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items: pageRows.map((r) => toPrivateMarketOffer(r.offer, r.ownerLead)),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  /** Usado pelo detalhe de Proprietários (E1) para embutir o card de verificação — null quando o proprietário não optou. */
  async getByOwnerLeadId(ownerLeadId: string): Promise<PrivateMarketOfferAdmin | null> {
    const [offer] = await this.db.select().from(privateMarketOffers).where(eq(privateMarketOffers.ownerLeadId, ownerLeadId)).limit(1);
    return offer ? toPrivateMarketOfferAdmin(offer) : null;
  }

  async verify(offerId: string, userId: string, request: VerifyPrivateMarketOfferRequest): Promise<PrivateMarketOfferAdmin> {
    const [offer] = await this.db.select().from(privateMarketOffers).where(eq(privateMarketOffers.id, offerId)).limit(1);
    if (!offer) throw new NotFoundException({ code: "PRIVATE_MARKET_OFFER_NOT_FOUND", message: "Oferta não encontrada" });

    const anonymizedSummary = request.anonymizedSummary ?? offer.anonymizedSummary ?? undefined;
    const minPrice: number | null =
      request.minPrice !== undefined ? request.minPrice : offer.minPrice ? Number(offer.minPrice) : null;

    if (request.status === "ELEGIVEL" && (!anonymizedSummary || !minPrice)) {
      throw new UnprocessableEntityException({
        code: "VERIFICATION_INCOMPLETE",
        message: "Informe o resumo anonimizado e o preço mínimo para marcar como elegível",
      });
    }

    await this.db
      .update(privateMarketOffers)
      .set({
        status: request.status,
        anonymizedSummary: anonymizedSummary ?? null,
        minPrice: minPrice !== null ? minPrice.toFixed(2) : null,
        offerDeadline: request.offerDeadline !== undefined ? (request.offerDeadline ? new Date(request.offerDeadline) : null) : offer.offerDeadline,
        verifiedByUserId: userId,
        verifiedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(privateMarketOffers.id, offerId));

    const [updated] = await this.db.select().from(privateMarketOffers).where(eq(privateMarketOffers.id, offerId)).limit(1);

    await this.auditLog.record({
      actorUserId: userId,
      action: `private_market_offer.${request.status === "ELEGIVEL" ? "verified_eligible" : "verified_inactive"}`,
      entityType: "private_market_offer",
      entityId: offerId,
    });

    return toPrivateMarketOfferAdmin(updated!);
  }

  /** Pedido de contato é sempre intermediado — nunca expõe o proprietário ao comprador. Reaproveita 100% o CRM (D3). */
  async requestContact(offerId: string, userId: string, request: RequestPrivateMarketContactRequest): Promise<void> {
    const [offer] = await this.db.select().from(privateMarketOffers).where(eq(privateMarketOffers.id, offerId)).limit(1);
    if (!offer) throw new NotFoundException({ code: "PRIVATE_MARKET_OFFER_NOT_FOUND", message: "Oferta não encontrada" });
    if (offer.status !== "ELEGIVEL") {
      throw new UnprocessableEntityException({ code: "OFFER_NOT_ELIGIBLE", message: "Esta oferta não está mais disponível" });
    }

    await this.db.insert(privateMarketContactRequests).values({ offerId, userId, message: request.message });
    await this.leads.recordSignal(userId, "CONTACT", "Pediu contato sobre uma oferta do Mercado Privado.");
  }
}
