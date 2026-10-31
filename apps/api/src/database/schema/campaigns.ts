import { CAMPAIGN_STATUSES, CAMPAIGN_TYPES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { date, index, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { developments } from "./developments";

export const campaignTypeEnum = pgEnum("campaign_type", CAMPAIGN_TYPES);
export const campaignStatusEnum = pgEnum("campaign_status", CAMPAIGN_STATUSES);

/**
 * Campanha de incorporadora/parceria (seção 4.9). `developmentId` é
 * opcional (campanhas institucionais não precisam ligar a um
 * empreendimento específico). Estatísticas (ver CampaignsService.stats)
 * vêm do vínculo units.propertyId → leads.sourcePropertyId do
 * empreendimento — não existe atribuição de lead por campanha individual
 * (exigiria UTM/tracking que não existe hoje), então campanhas do mesmo
 * empreendimento compartilham o mesmo número honesto.
 */
export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    developmentId: uuid("development_id").references(() => developments.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    type: campaignTypeEnum("type").notNull(),
    channel: text("channel").notNull(),
    sponsorName: text("sponsor_name"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date"),
    budget: numeric("budget", { precision: 14, scale: 2 }),
    status: campaignStatusEnum("status").notNull().default("RASCUNHO"),
    goalDescription: text("goal_description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("campaigns_status_idx").on(table.status), index("campaigns_development_idx").on(table.developmentId)],
);
