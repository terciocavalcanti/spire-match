import { PROPOSAL_STATUSES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { index, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { paymentMethodEnum, properties } from "./properties";
import { users } from "./users";

export const proposalStatusEnum = pgEnum("proposal_status", PROPOSAL_STATUSES);

export const proposals = pgTable(
  "proposals",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    paymentMethod: paymentMethodEnum("payment_method").notNull(),
    message: text("message"),
    status: proposalStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("proposals_user_idx").on(table.userId)],
);
