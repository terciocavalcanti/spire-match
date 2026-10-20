import { z } from "zod";

import { propertySummarySchema } from "./property";

export const favoriteSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  createdAt: z.string().datetime(),
  property: propertySummarySchema,
});
export type Favorite = z.infer<typeof favoriteSchema>;

export const addFavoriteRequestSchema = z.object({
  propertyId: z.string().uuid(),
});
export type AddFavoriteRequest = z.infer<typeof addFavoriteRequestSchema>;
