import { DATA_SUBJECT_REQUEST_STATUSES, DATA_SUBJECT_REQUEST_TYPES } from "@spire/contracts";
import { sql } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const dataSubjectRequestTypeEnum = pgEnum("data_subject_request_type", DATA_SUBJECT_REQUEST_TYPES);
export const dataSubjectRequestStatusEnum = pgEnum("data_subject_request_status", DATA_SUBJECT_REQUEST_STATUSES);

/**
 * Solicitações LGPD de titular de dados (Marco F). EXPORTACAO é resolvida
 * na hora pelo próprio serviço (ver DataSubjectRequestsService.create) —
 * fica aqui registrada como CONCLUIDO desde a criação, só para histórico.
 * EXCLUSAO fica PENDENTE até o time comercial confirmar ou rejeitar.
 */
export const dataSubjectRequests = pgTable(
  "data_subject_requests",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: dataSubjectRequestTypeEnum("type").notNull(),
    status: dataSubjectRequestStatusEnum("status").notNull().default("PENDENTE"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    handledByUserId: uuid("handled_by_user_id").references(() => users.id, { onDelete: "set null" }),
    rejectionReason: text("rejection_reason"),
  },
  (table) => [index("data_subject_requests_status_idx").on(table.status), index("data_subject_requests_user_idx").on(table.userId)],
);
