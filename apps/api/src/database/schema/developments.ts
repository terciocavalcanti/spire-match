import { DEVELOPMENT_STATUSES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { date, index, numeric, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const developmentStatusEnum = pgEnum("development_status", DEVELOPMENT_STATUSES);

/**
 * Empreendimento → Torre/Bloco (opcional) → Unidade (seção 4.2 do prompt
 * mestre). `priceFrom` é o preço de referência do empreendimento ("a partir
 * de"), sempre separado do preço de cada unidade em `units.price`.
 */
export const developments = pgTable(
  "developments",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: developmentStatusEnum("status").notNull().default("DRAFT"),
    // Nome livre por ora — vínculo com uma tabela de incorporadoras fica para o Marco E.
    incorporatorName: text("incorporator_name"),
    neighborhood: text("neighborhood").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    coverImageUrl: text("cover_image_url"),
    priceFrom: numeric("price_from", { precision: 14, scale: 2 }),
    deliveryDate: date("delivery_date"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("developments_status_idx").on(table.status)],
);

export const developmentBlocks = pgTable(
  "development_blocks",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    developmentId: uuid("development_id")
      .notNull()
      .references(() => developments.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("development_blocks_development_idx").on(table.developmentId)],
);
