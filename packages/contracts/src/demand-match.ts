import { z } from "zod";

import { listingPurposeSchema } from "./property";

// Demand Match (seção 4.8 do prompt mestre): contagem agregada de
// compradores com perfil compatível, calculada sob demanda (sem snapshot).
// Nunca expõe um número abaixo do limiar configurável — anti-identificação.
export const demandMatchQuerySchema = z.object({
  neighborhood: z.string().trim().min(1),
  purpose: listingPurposeSchema.optional(),
  priceMin: z.coerce.number().positive().optional(),
  priceMax: z.coerce.number().positive().optional(),
});
export type DemandMatchQuery = z.infer<typeof demandMatchQuerySchema>;

export const demandMatchResultSchema = z.object({
  count: z.number().int().nonnegative().nullable(),
  threshold: z.number().int().positive(),
  reason: z.literal("ABAIXO_DO_LIMIAR").nullable(),
  computedAt: z.string().datetime(),
});
export type DemandMatchResult = z.infer<typeof demandMatchResultSchema>;
