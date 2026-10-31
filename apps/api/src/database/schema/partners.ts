import { PARTNER_CATEGORIES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { boolean, date, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const partnerCategoryEnum = pgEnum("partner_category", PARTNER_CATEGORIES);

/** Club (seção 4.11) — diretório de parceiros com benefício e vigência. */
export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: partnerCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  ctaUrl: text("cta_url"),
  ctaLabel: text("cta_label"),
  termsUrl: text("terms_url"),
  validFrom: date("valid_from"),
  validUntil: date("valid_until"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
