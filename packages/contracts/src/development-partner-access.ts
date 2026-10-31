import { z } from "zod";

import { campaignStatsSchema } from "./campaigns";

// Acesso de incorporadora (papel DEVELOPER_PARTNER, seção 4.9) — só
// leitura, restrito aos empreendimentos liberados pelo time comercial.
export const developmentPartnerAccessSchema = z.object({
  id: z.string().uuid(),
  developmentId: z.string().uuid(),
  developmentName: z.string(),
  userId: z.string().uuid(),
  userName: z.string(),
  userEmail: z.string().email(),
  grantedAt: z.string().datetime(),
});
export type DevelopmentPartnerAccess = z.infer<typeof developmentPartnerAccessSchema>;

export const grantDevelopmentPartnerAccessRequestSchema = z.object({
  developmentId: z.string().uuid(),
  userId: z.string().uuid(),
});
export type GrantDevelopmentPartnerAccessRequest = z.infer<typeof grantDevelopmentPartnerAccessRequestSchema>;

export const myDevelopmentPartnerAccessSchema = z.object({
  developmentId: z.string().uuid(),
  developmentName: z.string(),
  developmentSlug: z.string(),
  stats: campaignStatsSchema,
});
export type MyDevelopmentPartnerAccess = z.infer<typeof myDevelopmentPartnerAccessSchema>;
