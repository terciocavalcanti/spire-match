import { sql } from "drizzle-orm";
import { integer, numeric, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { listingPurposeEnum, paymentMethodEnum } from "./properties";
import { users } from "./users";

export const buyerProfiles = pgTable("buyer_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),

  budgetMin: numeric("budget_min", { precision: 14, scale: 2 }),
  budgetMax: numeric("budget_max", { precision: 14, scale: 2 }),
  desiredNeighborhoods: text("desired_neighborhoods").array().notNull().default(sql`'{}'::text[]`),
  minAreaSqm: numeric("min_area_sqm", { precision: 10, scale: 2 }),
  minBedrooms: integer("min_bedrooms"),
  minParkingSpaces: integer("min_parking_spaces"),
  purpose: listingPurposeEnum("purpose"),
  paymentMethods: paymentMethodEnum("payment_methods")
    .array()
    .notNull()
    .default(sql`'{}'::payment_method[]`),
  desiredFeatures: text("desired_features").array().notNull().default(sql`'{}'::text[]`),

  onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
