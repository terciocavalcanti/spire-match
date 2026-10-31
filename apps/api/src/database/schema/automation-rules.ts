import { AUTOMATION_TYPES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const automationTypeEnum = pgEnum("automation_type", AUTOMATION_TYPES);

/**
 * Uma linha por tipo de automação (sem múltiplas regras do mesmo tipo —
 * simplicidade deliberada para D4). `roundRobinCursor` só é usado por
 * LEAD_AUTO_ASSIGN; fica em branco/ignorado para os demais tipos.
 */
export const automationRules = pgTable("automation_rules", {
  type: automationTypeEnum("type").primaryKey(),
  enabled: boolean("enabled").notNull().default(false),
  config: jsonb("config").notNull().default({}),
  roundRobinCursor: integer("round_robin_cursor").notNull().default(0),
  lastRunAt: timestamp("last_run_at", { withTimezone: true }),
  lastRunCount: integer("last_run_count"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
});
