import { CONTACT_CHANNELS } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { brokers } from "./brokers";
import { properties } from "./properties";
import { users } from "./users";

export const contactChannelEnum = pgEnum("contact_channel", CONTACT_CHANNELS);

/** Registro de "Fale com um consultor" — alimenta a caixa de Mensagens. */
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    brokerId: uuid("broker_id")
      .notNull()
      .references(() => brokers.id, { onDelete: "restrict" }),
    channel: contactChannelEnum("channel").notNull(),
    message: text("message").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("contacts_user_idx").on(table.userId)],
);
