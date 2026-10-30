import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { userStatusEnum } from "./enums";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  avatarUrl: text("avatar_url"),
  status: userStatusEnum("status").notNull().default("ACTIVE"),
  // Verdadeiro só para contas criadas pelo admin (D1) com senha temporária —
  // força a troca antes de liberar o resto do painel. Nunca setado para
  // contas que se autorregistram (já escolhem a própria senha).
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});
