import { z } from "zod";

import { brokerSchema } from "./brokers";
import { propertyTypeSchema } from "./property";

// Pipeline de captação (seção 4.8 do prompt mestre): NOVO → TRIAGEM → APROVADO
// → CONVERTIDO (vira um imóvel real no catálogo) ou REJEITADO.
export const OWNER_LEAD_STAGES = ["NOVO", "TRIAGEM", "APROVADO", "REJEITADO", "CONVERTIDO"] as const;
export const ownerLeadStageSchema = z.enum(OWNER_LEAD_STAGES);
export type OwnerLeadStage = z.infer<typeof ownerLeadStageSchema>;

export const OWNER_LEAD_INTENTS = ["VENDER", "ALUGAR", "ACEITAR_PROPOSTA"] as const;
export const ownerLeadIntentSchema = z.enum(OWNER_LEAD_INTENTS);
export type OwnerLeadIntent = z.infer<typeof ownerLeadIntentSchema>;

export const OWNER_LEAD_ACTIVITY_TYPES = ["CREATED", "STAGE_CHANGED", "ASSIGNED", "NOTE", "PUBLISHED"] as const;
export const ownerLeadActivityTypeSchema = z.enum(OWNER_LEAD_ACTIVITY_TYPES);
export type OwnerLeadActivityType = z.infer<typeof ownerLeadActivityTypeSchema>;

export const ownerLeadOwnerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().url().nullable(),
});
export type OwnerLeadOwner = z.infer<typeof ownerLeadOwnerSchema>;

export const ownerLeadActivitySchema = z.object({
  id: z.string().uuid(),
  type: ownerLeadActivityTypeSchema,
  description: z.string(),
  createdAt: z.string().datetime(),
});
export type OwnerLeadActivity = z.infer<typeof ownerLeadActivitySchema>;

export const ownerLeadSchema = z.object({
  id: z.string().uuid(),
  owner: ownerLeadOwnerSchema,
  assignedBroker: brokerSchema.nullable(),
  stage: ownerLeadStageSchema,
  intent: ownerLeadIntentSchema,
  propertyType: propertyTypeSchema,
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  areaSqm: z.number(),
  bedrooms: z.number().int(),
  parkingSpaces: z.number().int(),
  askingPrice: z.number().nullable(),
  description: z.string(),
  linkedPropertyId: z.string().uuid().nullable(),
  rejectionReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type OwnerLead = z.infer<typeof ownerLeadSchema>;

export const ownerLeadDetailSchema = ownerLeadSchema.extend({
  activities: z.array(ownerLeadActivitySchema),
});
export type OwnerLeadDetail = z.infer<typeof ownerLeadDetailSchema>;

export const createOwnerLeadRequestSchema = z.object({
  intent: ownerLeadIntentSchema,
  propertyType: propertyTypeSchema,
  neighborhood: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().length(2),
  areaSqm: z.number().positive(),
  bedrooms: z.number().int().nonnegative().default(0),
  parkingSpaces: z.number().int().nonnegative().default(0),
  askingPrice: z.number().positive().nullable().optional(),
  description: z.string().trim().max(3000).default(""),
  // Carimbado pelo servidor, não pelo cliente — o registro legal de
  // consentimento precisa do horário em que o backend validou o pedido.
  consent: z.boolean().refine((v) => v === true, { message: "Confirme o consentimento para continuar" }),
  privateMarketOptIn: z.boolean().default(false),
});
export type CreateOwnerLeadRequest = z.infer<typeof createOwnerLeadRequestSchema>;

export const ownerLeadListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  stage: ownerLeadStageSchema.optional(),
  assignedBrokerId: z.string().uuid().optional(),
  q: z.string().trim().min(1).optional(),
});
export type OwnerLeadListQuery = z.infer<typeof ownerLeadListQuerySchema>;

export const updateOwnerLeadStageRequestSchema = z.object({
  stage: ownerLeadStageSchema,
  rejectionReason: z.string().trim().max(500).optional(),
});
export type UpdateOwnerLeadStageRequest = z.infer<typeof updateOwnerLeadStageRequestSchema>;

export const assignOwnerLeadRequestSchema = z.object({ brokerId: z.string().uuid().nullable() });
export type AssignOwnerLeadRequest = z.infer<typeof assignOwnerLeadRequestSchema>;

export const createOwnerLeadNoteRequestSchema = z.object({ note: z.string().trim().min(1).max(1000) });
export type CreateOwnerLeadNoteRequest = z.infer<typeof createOwnerLeadNoteRequestSchema>;

export const publishOwnerLeadRequestSchema = z.object({
  price: z.number().positive().optional(),
});
export type PublishOwnerLeadRequest = z.infer<typeof publishOwnerLeadRequestSchema>;
