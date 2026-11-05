import { z } from "zod";

// Fundação de integrações externas ("novos recursos", M1). Nenhum provedor
// real está nomeado/credenciado ainda — ver comentário em
// apps/api/src/database/schema/integration-connections.ts e
// docs/product/NOVOS_RECURSOS_M0_DIAGNOSTICO.md.

export const INTEGRATION_DIRECTIONS = ["ENTRADA", "SAIDA", "AMBAS"] as const;
export const integrationDirectionSchema = z.enum(INTEGRATION_DIRECTIONS);
export type IntegrationDirection = z.infer<typeof integrationDirectionSchema>;

export const INTEGRATION_CONNECTION_STATUSES = ["PENDENTE", "ATIVA", "PAUSADA"] as const;
export const integrationConnectionStatusSchema = z.enum(INTEGRATION_CONNECTION_STATUSES);
export type IntegrationConnectionStatus = z.infer<typeof integrationConnectionStatusSchema>;

export const INTEGRATION_EVENT_DIRECTIONS = ["ENTRADA", "SAIDA"] as const;
export const integrationEventDirectionSchema = z.enum(INTEGRATION_EVENT_DIRECTIONS);
export type IntegrationEventDirection = z.infer<typeof integrationEventDirectionSchema>;

export const INTEGRATION_EVENT_STATUSES = ["PENDENTE", "PROCESSADO", "FALHOU", "DUPLICADO"] as const;
export const integrationEventStatusSchema = z.enum(INTEGRATION_EVENT_STATUSES);
export type IntegrationEventStatus = z.infer<typeof integrationEventStatusSchema>;

export const integrationConnectionSchema = z.object({
  id: z.string().uuid(),
  provider: z.string(),
  label: z.string(),
  direction: integrationDirectionSchema,
  status: integrationConnectionStatusSchema,
  config: z.record(z.string(), z.unknown()),
  lastSyncedAt: z.string().datetime().nullable(),
  lastErrorAt: z.string().datetime().nullable(),
  lastErrorMessage: z.string().nullable(),
  pendingEventsCount: z.number().int().nonnegative(),
  failedEventsCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type IntegrationConnection = z.infer<typeof integrationConnectionSchema>;

export const createIntegrationConnectionRequestSchema = z.object({
  provider: z.string().trim().min(1).max(60),
  label: z.string().trim().min(1).max(120),
  direction: integrationDirectionSchema.default("AMBAS"),
  config: z.record(z.string(), z.unknown()).default({}),
});
export type CreateIntegrationConnectionRequest = z.infer<typeof createIntegrationConnectionRequestSchema>;

export const updateIntegrationConnectionRequestSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});
export type UpdateIntegrationConnectionRequest = z.infer<typeof updateIntegrationConnectionRequestSchema>;

export const integrationEventSchema = z.object({
  id: z.string().uuid(),
  connectionId: z.string().uuid(),
  direction: integrationEventDirectionSchema,
  eventType: z.string(),
  externalEventId: z.string().nullable(),
  entityType: z.string().nullable(),
  internalId: z.string().uuid().nullable(),
  payload: z.record(z.string(), z.unknown()),
  status: integrationEventStatusSchema,
  attempts: z.number().int().nonnegative(),
  errorMessage: z.string().nullable(),
  receivedAt: z.string().datetime(),
  processedAt: z.string().datetime().nullable(),
});
export type IntegrationEvent = z.infer<typeof integrationEventSchema>;

export const integrationEventListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  status: integrationEventStatusSchema.optional(),
});
export type IntegrationEventListQuery = z.infer<typeof integrationEventListQuerySchema>;

export const retryFailedIntegrationEventsResultSchema = z.object({
  requeued: z.number().int().nonnegative(),
});
export type RetryFailedIntegrationEventsResult = z.infer<typeof retryFailedIntegrationEventsResultSchema>;
