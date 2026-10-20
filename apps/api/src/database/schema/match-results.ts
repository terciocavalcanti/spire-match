import type { MatchReasonCode } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { boolean, doublePrecision, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";


import { properties } from "./properties";
import { users } from "./users";

/**
 * Última pontuação calculada por par comprador-imóvel (upsert a cada
 * recálculo). `match_recalculations`/histórico completo fica para quando o
 * worker BullMQ assumir o recálculo assíncrono (Marco C) — por ora o cálculo
 * é síncrono sob demanda (`MatchService`, ver apps/api/src/matches).
 */
export const matchResults = pgTable(
  "match_results",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    rulesetVersion: text("ruleset_version").notNull(),
    reasons: jsonb("reasons").$type<{ code: MatchReasonCode; label: string }[]>().notNull(),
    distanceMeters: doublePrecision("distance_meters"),
    distanceSource: text("distance_source"),
    eliminated: boolean("eliminated").notNull().default(false),
    eliminationReason: text("elimination_reason"),
    computedAt: timestamp("computed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("match_results_user_property_uq").on(table.userId, table.propertyId)],
);
