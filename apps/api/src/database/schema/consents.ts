import { sql } from "drizzle-orm";
import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { consentPurposeEnum } from "./enums";
import { users } from "./users";

/**
 * Histórico append-only de consentimentos (seção 12 — LGPD). Cada concessão
 * ou revogação gera uma nova linha; o consentimento vigente é a linha mais
 * recente por (user_id, purpose). `evidence` guarda contexto probatório
 * (IP, user-agent, canal, texto apresentado) sem dados sensíveis desnecessários.
 */
export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  purpose: consentPurposeEnum("purpose").notNull(),
  granted: boolean("granted").notNull(),
  version: text("version").notNull(),
  evidence: jsonb("evidence").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
