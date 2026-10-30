import { UNIT_STATUSES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { index, integer, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { developmentBlocks, developments } from "./developments";
import { properties } from "./properties";

export const unitStatusEnum = pgEnum("unit_status", UNIT_STATUSES);

/**
 * Unidade dentro de um empreendimento. `propertyId` é um vínculo opcional
 * para quando a unidade também aparece no catálogo do comprador — ligar as
 * duas é uma ação deliberada do admin, nunca automática (D2 é inventário
 * administrativo, não redesenha o pipeline do catálogo do Marco B).
 */
export const units = pgTable(
  "units",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    developmentId: uuid("development_id")
      .notNull()
      .references(() => developments.id, { onDelete: "cascade" }),
    blockId: uuid("block_id").references(() => developmentBlocks.id, { onDelete: "set null" }),
    identifier: text("identifier").notNull(),
    floor: integer("floor"),
    areaSqm: numeric("area_sqm", { precision: 10, scale: 2 }).notNull(),
    bedrooms: integer("bedrooms").notNull().default(0),
    parkingSpaces: integer("parking_spaces").notNull().default(0),
    price: numeric("price", { precision: 14, scale: 2 }).notNull(),
    status: unitStatusEnum("status").notNull().default("AVAILABLE"),
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("units_development_idx").on(table.developmentId),
    index("units_status_idx").on(table.status),
  ],
);

export const unitPriceHistory = pgTable("unit_price_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  unitId: uuid("unit_id")
    .notNull()
    .references(() => units.id, { onDelete: "cascade" }),
  price: numeric("price", { precision: 14, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});
