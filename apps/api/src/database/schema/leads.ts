import { LEAD_ACTIVITY_TYPES, LEAD_STAGES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { index, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { brokers } from "./brokers";
import { properties } from "./properties";
import { users } from "./users";

export const leadStageEnum = pgEnum("lead_stage", LEAD_STAGES);
export const leadActivityTypeEnum = pgEnum("lead_activity_type", LEAD_ACTIVITY_TYPES);

/**
 * Um lead por comprador (não um por imóvel): o time comercial acompanha a
 * pessoa, não um evento isolado — por isso o índice único em `userId`.
 * `sourcePropertyId` guarda qual imóvel originou o primeiro contato, só
 * para contexto, sem significar que o lead é "sobre" aquele imóvel.
 */
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    sourcePropertyId: uuid("source_property_id").references(() => properties.id, { onDelete: "set null" }),
    assignedBrokerId: uuid("assigned_broker_id").references(() => brokers.id, { onDelete: "set null" }),
    stage: leadStageEnum("stage").notNull().default("NOVO"),
    score: integer("score").notNull().default(0),
    wonAmount: numeric("won_amount", { precision: 14, scale: 2 }),
    lostReason: text("lost_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("leads_stage_idx").on(table.stage), index("leads_broker_idx").on(table.assignedBrokerId)],
);

export const leadActivities = pgTable(
  "lead_activities",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    type: leadActivityTypeEnum("type").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("lead_activities_lead_idx").on(table.leadId, table.createdAt)],
);
