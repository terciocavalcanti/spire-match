import type { RadarCriteria } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { properties } from "./properties";
import { users } from "./users";

/**
 * Checagem é sob demanda (botão "Verificar agora" / disparada ao criar o
 * radar), não um cron em background — o worker BullMQ para varredura
 * periódica assíncrona fica para quando `apps/worker` for implantado
 * (mesma simplificação documentada em `match-results.ts`). Nada aqui finge
 * rodar em segundo plano quando não roda.
 */
export const radars = pgTable("radars", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  criteria: jsonb("criteria").$type<RadarCriteria>().notNull(),
  active: boolean("active").notNull().default(true),
  lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Evita notificar o mesmo imóvel mais de uma vez para o mesmo radar. */
export const radarSeenProperties = pgTable(
  "radar_seen_properties",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    radarId: uuid("radar_id")
      .notNull()
      .references(() => radars.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("radar_seen_properties_uq").on(table.radarId, table.propertyId),
    index("radar_seen_properties_radar_idx").on(table.radarId),
  ],
);
