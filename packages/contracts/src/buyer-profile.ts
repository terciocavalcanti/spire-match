import { z } from "zod";

import { listingPurposeSchema, paymentMethodSchema } from "./property";

export const buyerPreferencesSchema = z.object({
  budgetMin: z.number().nonnegative().nullable(),
  budgetMax: z.number().nonnegative().nullable(),
  desiredNeighborhoods: z.array(z.string()),
  minAreaSqm: z.number().nonnegative().nullable(),
  minBedrooms: z.number().int().nonnegative().nullable(),
  minParkingSpaces: z.number().int().nonnegative().nullable(),
  purpose: listingPurposeSchema.nullable(),
  paymentMethods: z.array(paymentMethodSchema),
  desiredFeatures: z.array(z.string()),
  onboardingCompletedAt: z.string().datetime().nullable(),
});
export type BuyerPreferences = z.infer<typeof buyerPreferencesSchema>;

export const updateBuyerPreferencesRequestSchema = z
  .object({
    budgetMin: z.number().nonnegative().nullable().optional(),
    budgetMax: z.number().nonnegative().nullable().optional(),
    desiredNeighborhoods: z.array(z.string()).optional(),
    minAreaSqm: z.number().nonnegative().nullable().optional(),
    minBedrooms: z.number().int().nonnegative().nullable().optional(),
    minParkingSpaces: z.number().int().nonnegative().nullable().optional(),
    purpose: listingPurposeSchema.nullable().optional(),
    paymentMethods: z.array(paymentMethodSchema).optional(),
    desiredFeatures: z.array(z.string()).optional(),
    completeOnboarding: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.budgetMin === undefined ||
      data.budgetMax === undefined ||
      data.budgetMin === null ||
      data.budgetMax === null ||
      data.budgetMin <= data.budgetMax,
    { message: "O orçamento mínimo não pode ser maior que o máximo", path: ["budgetMin"] },
  );
export type UpdateBuyerPreferencesRequest = z.infer<typeof updateBuyerPreferencesRequestSchema>;
