import { OWNER_LEAD_ACTIVITY_TYPES, OWNER_LEAD_INTENTS, OWNER_LEAD_STAGES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { index, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { brokers } from "./brokers";
import { properties, propertyTypeEnum } from "./properties";
import { users } from "./users";

export const ownerLeadStageEnum = pgEnum("owner_lead_stage", OWNER_LEAD_STAGES);
export const ownerLeadIntentEnum = pgEnum("owner_lead_intent", OWNER_LEAD_INTENTS);
export const ownerLeadActivityTypeEnum = pgEnum("owner_lead_activity_type", OWNER_LEAD_ACTIVITY_TYPES);

/**
 * Espelha `leads`/`lead_activities` (ver schema/leads.ts) do lado do
 * proprietário em vez do comprador — mesmo pipeline comercial, mesma lógica
 * de atribuição/notas/timeline, só o dono dos dados muda. `consentCaptureAt`
 * é carimbado pelo servidor no momento da criação (nunca confiado do
 * cliente) — é o registro legal do consentimento de triagem.
 */
export const ownerLeads = pgTable(
  "owner_leads",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedBrokerId: uuid("assigned_broker_id").references(() => brokers.id, { onDelete: "set null" }),
    stage: ownerLeadStageEnum("stage").notNull().default("NOVO"),
    intent: ownerLeadIntentEnum("intent").notNull(),
    propertyType: propertyTypeEnum("property_type").notNull(),
    neighborhood: text("neighborhood").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    areaSqm: numeric("area_sqm", { precision: 10, scale: 2 }).notNull(),
    bedrooms: integer("bedrooms").notNull().default(0),
    parkingSpaces: integer("parking_spaces").notNull().default(0),
    askingPrice: numeric("asking_price", { precision: 14, scale: 2 }),
    description: text("description").notNull().default(""),
    consentCaptureAt: timestamp("consent_capture_at", { withTimezone: true }).notNull(),
    // Setado quando a captação vira um imóvel real no catálogo (ver
    // OwnerLeadsService.publish) — fecha o laço "circuito autorizado".
    linkedPropertyId: uuid("linked_property_id").references(() => properties.id, { onDelete: "set null" }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("owner_leads_stage_idx").on(table.stage), index("owner_leads_broker_idx").on(table.assignedBrokerId)],
);

export const ownerLeadActivities = pgTable(
  "owner_lead_activities",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    ownerLeadId: uuid("owner_lead_id")
      .notNull()
      .references(() => ownerLeads.id, { onDelete: "cascade" }),
    type: ownerLeadActivityTypeEnum("type").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("owner_lead_activities_owner_lead_idx").on(table.ownerLeadId, table.createdAt)],
);
