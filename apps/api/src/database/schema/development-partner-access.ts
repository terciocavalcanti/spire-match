import { sql } from "drizzle-orm";
import { pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { developments } from "./developments";
import { users } from "./users";

/**
 * Acesso de incorporadora (papel DEVELOPER_PARTNER) a um empreendimento
 * específico — concedido explicitamente pelo time comercial, nunca
 * automático. A segurança real está nos guards de cada endpoint; esta
 * tabela só decide quais empreendimentos aparecem para cada parceiro.
 */
export const developmentPartnerAccess = pgTable(
  "development_partner_access",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    developmentId: uuid("development_id")
      .notNull()
      .references(() => developments.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    grantedByUserId: uuid("granted_by_user_id").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => [uniqueIndex("development_partner_access_dev_user_uq").on(table.developmentId, table.userId)],
);
