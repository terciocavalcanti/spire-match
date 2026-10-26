import { EXCLUSIVE_TYPES, LISTING_PURPOSES, PAYMENT_METHODS, PROPERTY_STATUSES, PROPERTY_TYPES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import {
  boolean,
  doublePrecision,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { brokers } from "./brokers";

export const propertyStatusEnum = pgEnum("property_status", PROPERTY_STATUSES);
export const propertyTypeEnum = pgEnum("property_type", PROPERTY_TYPES);
export const listingPurposeEnum = pgEnum("listing_purpose", LISTING_PURPOSES);
export const exclusiveTypeEnum = pgEnum("exclusive_type", EXCLUSIVE_TYPES);
// Array de texto (não enum do Postgres) — um imóvel aceita múltiplas formas de pagamento.
export const paymentMethodEnum = pgEnum("payment_method", PAYMENT_METHODS);

/**
 * Localização em `lat`/`lng` simples (não `geography` do PostGIS). Simplificação
 * documentada do Marco B: o Match Engine calcula distância via haversine em
 * `packages/domain`, e a busca "perto de mim" pré-filtra por bounding box
 * indexado antes do cálculo preciso — suficiente para o volume atual (dezenas
 * de imóveis). Uma coluna `geography(Point,4326)` + índice GiST fica reservada
 * para quando o volume de imóveis justificar `ST_DWithin` no banco (Marco F).
 */
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    type: propertyTypeEnum("type").notNull(),
    purpose: listingPurposeEnum("purpose").notNull(),
    status: propertyStatusEnum("status").notNull().default("DRAFT"),

    price: numeric("price", { precision: 14, scale: 2 }).notNull(),
    condominiumFee: numeric("condominium_fee", { precision: 14, scale: 2 }),
    iptu: numeric("iptu", { precision: 14, scale: 2 }),

    areaSqm: numeric("area_sqm", { precision: 10, scale: 2 }).notNull(),
    bedrooms: integer("bedrooms").notNull().default(0),
    bathrooms: integer("bathrooms").notNull().default(0),
    parkingSpaces: integer("parking_spaces").notNull().default(0),

    neighborhood: text("neighborhood").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),

    coverImageUrl: text("cover_image_url"),
    features: text("features").array().notNull().default(sql`'{}'::text[]`),
    acceptedPaymentMethods: paymentMethodEnum("accepted_payment_methods")
      .array()
      .notNull()
      .default(sql`'{}'::payment_method[]`),

    isExclusive: boolean("is_exclusive").notNull().default(false),
    exclusiveType: exclusiveTypeEnum("exclusive_type"),
    // Patrocínio é só posicionamento editorial — nunca entra no cálculo do Match Score.
    isSponsored: boolean("is_sponsored").notNull().default(false),

    // Corretor responsável/autorizado pelo imóvel — nulo até a captação real
    // (Marco E) atribuir um; "Fale com consultor" exige esse vínculo.
    brokerId: uuid("broker_id").references(() => brokers.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("properties_status_idx").on(table.status),
    index("properties_neighborhood_idx").on(table.neighborhood),
    index("properties_lat_lng_idx").on(table.lat, table.lng),
    index("properties_price_idx").on(table.price),
  ],
);

export const propertyImages = pgTable(
  "property_images",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("property_images_property_idx").on(table.propertyId)],
);

export const propertyPriceHistory = pgTable("property_price_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  price: numeric("price", { precision: 14, scale: 2 }).notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});
