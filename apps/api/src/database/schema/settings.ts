import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

/**
 * Configuração em chave/valor (D5: pesos do Match Engine, intervalo do
 * sweep de radar; D3: taxa de comissão padrão). Uma linha por chave,
 * ausência de linha = usa o fallback de código documentado no
 * SettingsService — nunca falha por configuração ausente.
 */
export const platformSettings = pgTable("platform_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
});
