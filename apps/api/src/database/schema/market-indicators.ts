import { sql } from "drizzle-orm";
import { boolean, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Pulse (seção 4.11) — indicador de mercado. `source`/`methodology`/`period`
 * são NOT NULL de propósito: nunca publicar um número sem proveniência
 * declarada. Sem provedor de dados real integrado ainda, cada linha é
 * cadastrada manualmente pelo time de conteúdo.
 */
export const marketIndicators = pgTable("market_indicators", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  value: numeric("value", { precision: 14, scale: 4 }).notNull(),
  unit: text("unit").notNull(),
  region: text("region").notNull(),
  period: text("period").notNull(),
  source: text("source").notNull(),
  methodology: text("methodology").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
