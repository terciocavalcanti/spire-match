import { z } from "zod";

// Club (seção 4.11 do prompt mestre): diretório de parceiros (financiamento,
// seguros, arquitetura, reforma) com benefício, vigência e termos.
export const PARTNER_CATEGORIES = ["FINANCIAMENTO", "SEGUROS", "ARQUITETURA", "REFORMA", "OUTRO"] as const;
export const partnerCategorySchema = z.enum(PARTNER_CATEGORIES);
export type PartnerCategory = z.infer<typeof partnerCategorySchema>;

export const partnerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: partnerCategorySchema,
  description: z.string(),
  ctaUrl: z.string().url().nullable(),
  ctaLabel: z.string().nullable(),
  termsUrl: z.string().url().nullable(),
  validFrom: z.string().nullable(),
  validUntil: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Partner = z.infer<typeof partnerSchema>;

export const createPartnerRequestSchema = z.object({
  name: z.string().trim().min(2).max(160),
  category: partnerCategorySchema,
  description: z.string().trim().min(1).max(2000),
  ctaUrl: z.string().trim().url().nullable().optional(),
  ctaLabel: z.string().trim().max(60).nullable().optional(),
  termsUrl: z.string().trim().url().nullable().optional(),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  active: z.boolean().default(true),
});
export type CreatePartnerRequest = z.infer<typeof createPartnerRequestSchema>;

export const updatePartnerRequestSchema = createPartnerRequestSchema.partial();
export type UpdatePartnerRequest = z.infer<typeof updatePartnerRequestSchema>;
