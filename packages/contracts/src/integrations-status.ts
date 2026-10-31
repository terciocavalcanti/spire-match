import { z } from "zod";

export const INTEGRATION_KEYS = ["maps", "storage", "smtp", "whatsapp", "llm", "webPush"] as const;
export const integrationKeySchema = z.enum(INTEGRATION_KEYS);
export type IntegrationKey = z.infer<typeof integrationKeySchema>;

export const INTEGRATION_STATUSES = ["ATIVO", "PENDENTE"] as const;
export const integrationStatusSchema = z.enum(INTEGRATION_STATUSES);
export type IntegrationStatus = z.infer<typeof integrationStatusSchema>;

export const integrationStatusEntrySchema = z.object({
  key: integrationKeySchema,
  label: z.string(),
  status: integrationStatusSchema,
  description: z.string(),
});
export type IntegrationStatusEntry = z.infer<typeof integrationStatusEntrySchema>;
