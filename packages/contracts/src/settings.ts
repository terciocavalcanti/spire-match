import { z } from "zod";

// Mesmas 8 chaves de MatchWeights em packages/domain/src/match/types.ts —
// duplicado aqui de propósito (contracts não depende de domain) e checado
// no servidor contra a soma ~1.0 antes de salvar.
export const matchWeightsSchema = z.object({
  budget: z.number().min(0).max(1),
  region: z.number().min(0).max(1),
  proximity: z.number().min(0).max(1),
  area: z.number().min(0).max(1),
  roomsFeatures: z.number().min(0).max(1),
  purpose: z.number().min(0).max(1),
  payment: z.number().min(0).max(1),
  preferenceSignals: z.number().min(0).max(1),
});
export type MatchWeightsInput = z.infer<typeof matchWeightsSchema>;

export const platformSettingsSchema = z.object({
  matchWeights: matchWeightsSchema,
  matchWeightsIsDefault: z.boolean(),
  commissionDefaultRate: z.number().positive().max(0.5),
  radarSweepIntervalMinutes: z.number().int().positive(),
  demandMatchThreshold: z.number().int().positive(),
  dataRetentionDays: z.number().int().positive(),
});
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

export const updateMatchWeightsRequestSchema = z.object({ weights: matchWeightsSchema });
export type UpdateMatchWeightsRequest = z.infer<typeof updateMatchWeightsRequestSchema>;

export const updateCommissionRateRequestSchema = z.object({ rate: z.number().positive().max(0.5) });
export type UpdateCommissionRateRequest = z.infer<typeof updateCommissionRateRequestSchema>;

export const updateRadarSweepIntervalRequestSchema = z.object({ minutes: z.number().int().positive().max(1440) });
export type UpdateRadarSweepIntervalRequest = z.infer<typeof updateRadarSweepIntervalRequestSchema>;

export const updateDemandMatchThresholdRequestSchema = z.object({ threshold: z.number().int().min(2).max(100) });
export type UpdateDemandMatchThresholdRequest = z.infer<typeof updateDemandMatchThresholdRequestSchema>;

export const updateDataRetentionDaysRequestSchema = z.object({ days: z.number().int().min(30).max(3650) });
export type UpdateDataRetentionDaysRequest = z.infer<typeof updateDataRetentionDaysRequestSchema>;
