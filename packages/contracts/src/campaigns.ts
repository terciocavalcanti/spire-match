import { z } from "zod";

// Campanhas de incorporadoras/parcerias (seção 4.9 do prompt mestre).
export const CAMPAIGN_TYPES = ["LANCAMENTO", "INSTITUCIONAL", "PERFORMANCE"] as const;
export const campaignTypeSchema = z.enum(CAMPAIGN_TYPES);
export type CampaignType = z.infer<typeof campaignTypeSchema>;

export const CAMPAIGN_STATUSES = ["RASCUNHO", "ATIVA", "PAUSADA", "ENCERRADA"] as const;
export const campaignStatusSchema = z.enum(CAMPAIGN_STATUSES);
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;

export const campaignSchema = z.object({
  id: z.string().uuid(),
  developmentId: z.string().uuid().nullable(),
  developmentName: z.string().nullable(),
  name: z.string(),
  type: campaignTypeSchema,
  channel: z.string(),
  sponsorName: z.string().nullable(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  budget: z.number().nullable(),
  status: campaignStatusSchema,
  goalDescription: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Campaign = z.infer<typeof campaignSchema>;

export const createCampaignRequestSchema = z.object({
  developmentId: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(2).max(160),
  type: campaignTypeSchema,
  channel: z.string().trim().min(1).max(80),
  sponsorName: z.string().trim().max(160).nullable().optional(),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
  budget: z.number().positive().nullable().optional(),
  goalDescription: z.string().trim().max(1000).nullable().optional(),
});
export type CreateCampaignRequest = z.infer<typeof createCampaignRequestSchema>;

export const updateCampaignRequestSchema = createCampaignRequestSchema.partial().extend({
  status: campaignStatusSchema.optional(),
});
export type UpdateCampaignRequest = z.infer<typeof updateCampaignRequestSchema>;

export const campaignListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  status: campaignStatusSchema.optional(),
});
export type CampaignListQuery = z.infer<typeof campaignListQuerySchema>;

// Honesto-zerado quando nenhuma unidade do empreendimento está vinculada a
// um imóvel do catálogo (units.propertyId) — nunca um número fabricado.
export const campaignStatsSchema = z.object({
  leadsCount: z.number().int().nonnegative(),
  wonCount: z.number().int().nonnegative(),
  vgv: z.number().nonnegative(),
  linkedPropertiesCount: z.number().int().nonnegative(),
});
export type CampaignStats = z.infer<typeof campaignStatsSchema>;
