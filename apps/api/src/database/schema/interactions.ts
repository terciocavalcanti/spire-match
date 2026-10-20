import { INTERACTION_TYPES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { index, jsonb, pgEnum, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";


import { properties } from "./properties";
import { users } from "./users";

export const interactionTypeEnum = pgEnum("interaction_type", INTERACTION_TYPES);

export const userInteractions = pgTable(
  "user_interactions",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    type: interactionTypeEnum("type").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("user_interactions_user_idx").on(table.userId),
    index("user_interactions_property_idx").on(table.propertyId),
    index("user_interactions_type_idx").on(table.type),
  ],
);
