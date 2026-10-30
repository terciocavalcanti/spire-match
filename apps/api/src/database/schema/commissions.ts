import { COMMISSION_STATUSES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { index, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { brokers } from "./brokers";
import { leadActivityTypeEnum, leads } from "./leads";
import { properties } from "./properties";

/**
 * Log append-only de cada sinal comercial real de um lead (mesmos tipos de
 * `leadActivities` registrados via `LeadsService.recordSignal`). Base do
 * relatório de atribuição first/last/influenced (D3) — nunca inclui dado de
 * campanha/UTM que o funil não coleta de verdade.
 */
export const leadTouchpoints = pgTable(
  "lead_touchpoints",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    channel: leadActivityTypeEnum("channel").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("lead_touchpoints_lead_idx").on(table.leadId, table.occurredAt)],
);

export const commissionStatusEnum = pgEnum("commission_status", COMMISSION_STATUSES);

/**
 * Criada automaticamente quando um lead vira GANHO (ver LeadsService).
 * `rate`/`previstoAmount` são um retrato do momento da criação — mudar a
 * taxa padrão depois (D5) não altera comissões já geradas.
 */
export const commissions = pgTable(
  "commissions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    brokerId: uuid("broker_id").references(() => brokers.id, { onDelete: "set null" }),
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
    baseAmount: numeric("base_amount", { precision: 14, scale: 2 }).notNull(),
    rate: numeric("rate", { precision: 5, scale: 4 }).notNull(),
    previstoAmount: numeric("previsto_amount", { precision: 14, scale: 2 }).notNull(),
    recebidoAmount: numeric("recebido_amount", { precision: 14, scale: 2 }),
    recebidoAt: timestamp("recebido_at", { withTimezone: true }),
    status: commissionStatusEnum("status").notNull().default("PREVISTO"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("commissions_status_idx").on(table.status), index("commissions_broker_idx").on(table.brokerId)],
);
