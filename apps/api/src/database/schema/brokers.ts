import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Diretório de corretores — entidade própria, sem login (RBAC/painel do
 * corretor fica para o Marco D). `phone` fica nulo até existir um corretor
 * real cadastrado; o CTA de WhatsApp no app nunca usa um número fictício
 * (ver apps/web `AtendimentoPage`).
 */
export const brokers = pgTable("brokers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  bio: text("bio").notNull().default(""),
  creci: text("creci"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
