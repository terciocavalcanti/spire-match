import { z } from "zod";

import { propertySummarySchema } from "./property";

export const MATCH_REASON_CODES = [
  "BUDGET_FIT",
  "PREFERRED_AREA",
  "NEARBY",
  "AREA_FIT",
  "ROOMS_FIT",
  "FEATURES_FIT",
  "PURPOSE_FIT",
  "PAYMENT_FIT",
  "PREFERENCE_SIGNAL",
] as const;
export const matchReasonCodeSchema = z.enum(MATCH_REASON_CODES);
export type MatchReasonCode = z.infer<typeof matchReasonCodeSchema>;

export const matchReasonSchema = z.object({
  code: matchReasonCodeSchema,
  label: z.string(),
});

export const matchResultSchema = z.object({
  propertyId: z.string().uuid(),
  score: z.number().min(0).max(100),
  rulesetVersion: z.string(),
  reasons: z.array(matchReasonSchema),
  distanceMeters: z.number().nullable(),
  distanceSource: z.enum(["GEOLOCATION_API"]).nullable(),
  computedAt: z.string().datetime(),
  property: propertySummarySchema,
});
export type MatchResult = z.infer<typeof matchResultSchema>;

export const matchQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
});
export type MatchQuery = z.infer<typeof matchQuerySchema>;

export const recalculateMatchesRequestSchema = z.object({
  lat: z.number().optional(),
  lng: z.number().optional(),
});
export type RecalculateMatchesRequest = z.infer<typeof recalculateMatchesRequestSchema>;
