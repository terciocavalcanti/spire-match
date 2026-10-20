import { z } from "zod";

import { listingPurposeSchema, propertySummarySchema, propertyTypeSchema } from "./property";

export const aiSearchRequestSchema = z.object({
  query: z.string().trim().min(2).max(300),
});
export type AiSearchRequest = z.infer<typeof aiSearchRequestSchema>;

export const aiSearchFiltersSchema = z.object({
  priceMin: z.number().nullable(),
  priceMax: z.number().nullable(),
  bedroomsMin: z.number().int().nullable(),
  neighborhoods: z.array(z.string()),
  type: propertyTypeSchema.nullable(),
  purpose: listingPurposeSchema.nullable(),
});
export type AiSearchFilters = z.infer<typeof aiSearchFiltersSchema>;

export const aiSearchResponseSchema = z.object({
  explanation: z.string(),
  filters: aiSearchFiltersSchema,
  items: z.array(propertySummarySchema),
  provider: z.enum(["DETERMINISTIC", "LLM"]),
});
export type AiSearchResponse = z.infer<typeof aiSearchResponseSchema>;
