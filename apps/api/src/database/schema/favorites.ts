import { sql } from "drizzle-orm";
import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { properties } from "./properties";
import { users } from "./users";

export const favorites = pgTable(
  "favorites",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("favorites_user_property_uq").on(table.userId, table.propertyId)],
);
