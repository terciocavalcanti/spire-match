import { PRIVATE_MARKET_OFFER_STATUSES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { index, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { ownerLeads } from "./owner-leads";
import { users } from "./users";

export const privateMarketOfferStatusEnum = pgEnum("private_market_offer_status", PRIVATE_MARKET_OFFER_STATUSES);

/**
 * Uma oferta por captação (não por imóvel) — criada automaticamente quando o
 * proprietário marca o opt-in de Mercado Privado no formulário de captação
 * (ver OwnerLeadsService.create → PrivateMarketService.createForOwnerLead).
 * Fica PENDENTE_VERIFICACAO até o time comercial preencher o resumo
 * anonimizado + preço mínimo e marcar ELEGIVEL.
 */
export const privateMarketOffers = pgTable(
  "private_market_offers",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    ownerLeadId: uuid("owner_lead_id")
      .notNull()
      .unique()
      .references(() => ownerLeads.id, { onDelete: "cascade" }),
    status: privateMarketOfferStatusEnum("status").notNull().default("PENDENTE_VERIFICACAO"),
    minPrice: numeric("min_price", { precision: 14, scale: 2 }),
    anonymizedSummary: text("anonymized_summary"),
    offerDeadline: timestamp("offer_deadline", { withTimezone: true }),
    verifiedByUserId: uuid("verified_by_user_id").references(() => users.id, { onDelete: "set null" }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("private_market_offers_status_idx").on(table.status)],
);

/**
 * Registro legal do consentimento específico de Mercado Privado — separado
 * de owner_leads.consentCaptureAt porque é uma autorização distinta
 * (divulgação anônima a compradores terceiros, não só triagem interna).
 */
export const privateMarketConsents = pgTable("private_market_consents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerLeadId: uuid("owner_lead_id")
    .notNull()
    .unique()
    .references(() => ownerLeads.id, { onDelete: "cascade" }),
  consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
});

export const privateMarketContactRequests = pgTable(
  "private_market_contact_requests",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => privateMarketOffers.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    message: text("message").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("private_market_contact_requests_offer_idx").on(table.offerId)],
);
