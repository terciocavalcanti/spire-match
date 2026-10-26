import { z } from "zod";

import { propertySummarySchema } from "./property";

export const tourStopSchema = z.object({
  order: z.number().int().nonnegative(),
  property: propertySummarySchema,
  score: z.number().min(0).max(100).nullable(),
  distanceFromPreviousMeters: z.number().nonnegative().nullable(),
});
export type TourStop = z.infer<typeof tourStopSchema>;

export const tourSchema = z.object({
  stops: z.array(tourStopSchema),
  totalDistanceMeters: z.number().nonnegative(),
});
export type Tour = z.infer<typeof tourSchema>;

export const generateTourRequestSchema = z.object({
  propertyIds: z.array(z.string().uuid()).min(2).max(5),
});
export type GenerateTourRequest = z.infer<typeof generateTourRequestSchema>;
