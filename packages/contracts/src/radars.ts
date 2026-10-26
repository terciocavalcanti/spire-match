import { z } from "zod";

import { listingPurposeSchema, propertyTypeSchema } from "./property";

export const radarCriteriaSchema = z.object({
  neighborhoods: z.array(z.string()).default([]),
  type: propertyTypeSchema.optional(),
  purpose: listingPurposeSchema.optional(),
  priceMax: z.number().positive().optional(),
  bedroomsMin: z.number().int().nonnegative().optional(),
});
export type RadarCriteria = z.infer<typeof radarCriteriaSchema>;

export const radarSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  criteria: radarCriteriaSchema,
  active: z.boolean(),
  lastCheckedAt: z.string().datetime().nullable(),
  newMatchesCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});
export type Radar = z.infer<typeof radarSchema>;

export const createRadarRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
  criteria: radarCriteriaSchema,
});
export type CreateRadarRequest = z.infer<typeof createRadarRequestSchema>;
