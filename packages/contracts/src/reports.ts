import { z } from "zod";

import { leadActivityTypeSchema } from "./leads";

export const reportsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
});
export type ReportsQuery = z.infer<typeof reportsQuerySchema>;

// Atribuição é calculada só a partir de sinais reais que o funil já
// registra (contato, visita, proposta...) — nunca de dados de campanha/UTM
// que o produto não coleta (ver lead_touchpoints).
export const attributionLeadRowSchema = z.object({
  leadId: z.string().uuid(),
  buyerName: z.string(),
  wonAmount: z.number(),
  firstTouchChannel: leadActivityTypeSchema,
  firstTouchAt: z.string().datetime(),
  lastTouchChannel: leadActivityTypeSchema,
  lastTouchAt: z.string().datetime(),
  influencedChannels: z.array(leadActivityTypeSchema),
});
export type AttributionLeadRow = z.infer<typeof attributionLeadRowSchema>;

export const attributionBreakdownEntrySchema = z.object({
  channel: leadActivityTypeSchema,
  wonCount: z.number().int().nonnegative(),
  vgv: z.number().nonnegative(),
});
export type AttributionBreakdownEntry = z.infer<typeof attributionBreakdownEntrySchema>;

export const attributionReportSchema = z.object({
  rows: z.array(attributionLeadRowSchema),
  byFirstTouch: z.array(attributionBreakdownEntrySchema),
  byLastTouch: z.array(attributionBreakdownEntrySchema),
});
export type AttributionReport = z.infer<typeof attributionReportSchema>;

export const vgvBreakdownEntrySchema = z.object({
  key: z.string(),
  label: z.string(),
  vgv: z.number().nonnegative(),
  wonCount: z.number().int().nonnegative(),
});
export type VgvBreakdownEntry = z.infer<typeof vgvBreakdownEntrySchema>;

export const VGV_GROUP_BY = ["broker", "neighborhood"] as const;
export const vgvGroupBySchema = z.enum(VGV_GROUP_BY);
export type VgvGroupBy = z.infer<typeof vgvGroupBySchema>;

export const vgvReportQuerySchema = reportsQuerySchema.extend({
  groupBy: vgvGroupBySchema.default("broker"),
});
export type VgvReportQuery = z.infer<typeof vgvReportQuerySchema>;

export const vgvReportSchema = z.object({
  vgv: z.number().nonnegative(),
  wonCount: z.number().int().nonnegative(),
  breakdown: z.array(vgvBreakdownEntrySchema),
});
export type VgvReport = z.infer<typeof vgvReportSchema>;
