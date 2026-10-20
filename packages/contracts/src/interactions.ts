import { z } from "zod";

// Distingue curtida/intenção comercial de favorito explícito (seção 4.3 do prompt mestre).
export const INTERACTION_TYPES = [
  "VIEW",
  "LIKE",
  "DISLIKE",
  "FAVORITE",
  "UNFAVORITE",
  "SHARE",
  "COMPARE",
  "CONTACT",
  "VISIT_REQUEST",
  "SIMULATION",
  "PROPOSAL",
] as const;
export const interactionTypeSchema = z.enum(INTERACTION_TYPES);
export type InteractionType = z.infer<typeof interactionTypeSchema>;

export const createInteractionRequestSchema = z.object({
  propertyId: z.string().uuid(),
  type: interactionTypeSchema,
});
export type CreateInteractionRequest = z.infer<typeof createInteractionRequestSchema>;
