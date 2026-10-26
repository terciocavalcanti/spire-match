import { VISIT_STATUSES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { brokers } from "./brokers";
import { properties } from "./properties";
import { users } from "./users";

export const visitStatusEnum = pgEnum("visit_status", VISIT_STATUSES);

/**
 * Reserva atômica: o índice único (broker, horário) garante no nível do
 * banco que dois compradores nunca conseguem agendar o mesmo corretor no
 * mesmo slot — uma tentativa concorrente falha com violação de unicidade,
 * tratada pelo VisitsService como "horário já reservado" (não uma race
 * condition silenciosa resolvida em memória).
 */
export const visits = pgTable(
  "visits",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    brokerId: uuid("broker_id")
      .notNull()
      .references(() => brokers.id, { onDelete: "restrict" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    status: visitStatusEnum("status").notNull().default("SCHEDULED"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Índice único PARCIAL: só considera visitas não canceladas, então
    // cancelar uma visita libera o horário de verdade para outra reserva.
    uniqueIndex("visits_broker_slot_uq")
      .on(table.brokerId, table.scheduledAt)
      .where(sql`${table.status} != 'CANCELLED'`),
  ],
);
