import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

export const integrationDirectionEnum = pgEnum("integration_direction", ["ENTRADA", "SAIDA", "AMBAS"]);
export const integrationConnectionStatusEnum = pgEnum("integration_connection_status", ["PENDENTE", "ATIVA", "PAUSADA"]);
export const integrationEventDirectionEnum = pgEnum("integration_event_direction", ["ENTRADA", "SAIDA"]);
export const integrationEventStatusEnum = pgEnum("integration_event_status", ["PENDENTE", "PROCESSADO", "FALHOU", "DUPLICADO"]);

/**
 * Fundação de integrações externas ("novos recursos", M1). Nenhum provedor
 * real está nomeado/credenciado ainda — `provider` é texto livre, preenchido
 * só quando uma conexão real existir (nunca simulada como ativa sem
 * credencial real, mesma regra do checklist D6 em integrations-status).
 * "Isolar por imobiliária" é tratado aqui como isolar por CONEXÃO — ver
 * docs/product/NOVOS_RECURSOS_M0_DIAGNOSTICO.md: o sistema é single-tenant
 * (uma única imobiliária), sem tabela de organização/tenant, então cada
 * conexão já é seu próprio escopo de credenciais/config/histórico.
 */
export const integrationConnections = pgTable("integration_connections", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  provider: text("provider").notNull(),
  label: text("label").notNull(),
  direction: integrationDirectionEnum("direction").notNull().default("AMBAS"),
  status: integrationConnectionStatusEnum("status").notNull().default("PENDENTE"),
  config: jsonb("config").notNull().default({}),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  lastErrorAt: timestamp("last_error_at", { withTimezone: true }),
  lastErrorMessage: text("last_error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedByUserId: uuid("updated_by_user_id").references(() => users.id, { onDelete: "set null" }),
});

/**
 * Mapa de identificadores internos ↔ externos por conexão — resolve
 * duplicidade (ex.: o mesmo contato recebido duas vezes de uma fonte
 * externa) por constraint de banco, não por heurística de nome/telefone a
 * cada chamada.
 */
export const integrationExternalRefs = pgTable(
  "integration_external_refs",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => integrationConnections.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    internalId: uuid("internal_id").notNull(),
    externalId: text("external_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("integration_external_refs_external_uq").on(table.connectionId, table.entityType, table.externalId),
    uniqueIndex("integration_external_refs_internal_uq").on(table.connectionId, table.entityType, table.internalId),
  ],
);

/**
 * Histórico de eventos de integração — nunca perde um evento recebido;
 * `externalEventId` (quando a fonte fornece um) é a chave de dedupe real,
 * garantida por índice único parcial válido sob concorrência, não só em
 * memória. `status` aqui descreve só o ciclo de vida do EVENTO em si
 * (recebido/processado/falhou/duplicado) — o que "processado" significa de
 * fato (criar lead, atualizar anúncio...) é implementado por milestone (M2,
 * M5...), não nesta fundação.
 */
export const integrationEvents = pgTable(
  "integration_events",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    connectionId: uuid("connection_id")
      .notNull()
      .references(() => integrationConnections.id, { onDelete: "cascade" }),
    direction: integrationEventDirectionEnum("direction").notNull(),
    eventType: text("event_type").notNull(),
    externalEventId: text("external_event_id"),
    entityType: text("entity_type"),
    internalId: uuid("internal_id"),
    payload: jsonb("payload").notNull(),
    status: integrationEventStatusEnum("status").notNull().default("PENDENTE"),
    attempts: integer("attempts").notNull().default(0),
    errorMessage: text("error_message"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    index("integration_events_connection_status_idx").on(table.connectionId, table.status),
    uniqueIndex("integration_events_dedupe_uq")
      .on(table.connectionId, table.externalEventId)
      .where(sql`${table.externalEventId} IS NOT NULL`),
  ],
);
