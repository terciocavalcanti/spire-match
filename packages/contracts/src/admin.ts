import { z } from "zod";

import { leadStageSchema } from "./leads";

export const adminOverviewSchema = z.object({
  newLeadsLast7Days: z.number().int().nonnegative(),
  hotLeadsCount: z.number().int().nonnegative(),
  visitsScheduledLast7Days: z.number().int().nonnegative(),
  wonLeadsLast30Days: z.number().int().nonnegative(),
  vgvLast30Days: z.number().nonnegative(),
  leadsByStage: z.array(z.object({ stage: leadStageSchema, count: z.number().int().nonnegative() })),
});
export type AdminOverview = z.infer<typeof adminOverviewSchema>;

export const funnelReportSchema = z.object({
  leadsByStage: z.array(z.object({ stage: leadStageSchema, count: z.number().int().nonnegative() })),
  conversionRate: z.number().min(0).max(100),
  vgv: z.number().nonnegative(),
  wonCount: z.number().int().nonnegative(),
  lostCount: z.number().int().nonnegative(),
});
export type FunnelReport = z.infer<typeof funnelReportSchema>;

export const adminReportsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(365).default(30),
});
export type AdminReportsQuery = z.infer<typeof adminReportsQuerySchema>;
