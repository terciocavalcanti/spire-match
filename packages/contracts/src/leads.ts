import { z } from "zod";

import { brokerSchema } from "./brokers";
import { propertySummarySchema } from "./property";

// Ordem reflete o funil real (seção "Funil comercial" do prompt mestre):
// Novo → Qualificando → Interesse → Visita → Proposta → Negociação → Ganho/Perdido.
export const LEAD_STAGES = [
  "NOVO",
  "QUALIFICANDO",
  "INTERESSE",
  "VISITA",
  "PROPOSTA",
  "NEGOCIACAO",
  "GANHO",
  "PERDIDO",
] as const;
export const leadStageSchema = z.enum(LEAD_STAGES);
export type LeadStage = z.infer<typeof leadStageSchema>;

export const LEAD_TEMPERATURES = ["FRIO", "MORNO", "QUENTE"] as const;
export const leadTemperatureSchema = z.enum(LEAD_TEMPERATURES);
export type LeadTemperature = z.infer<typeof leadTemperatureSchema>;

export const LEAD_ACTIVITY_TYPES = [
  "CREATED",
  "STAGE_CHANGED",
  "CONTACT",
  "VISIT_SCHEDULED",
  "VISIT_CANCELLED",
  "PROPOSAL_RECEIVED",
  "ASSIGNED",
  "NOTE",
] as const;
export const leadActivityTypeSchema = z.enum(LEAD_ACTIVITY_TYPES);
export type LeadActivityType = z.infer<typeof leadActivityTypeSchema>;

export const leadBuyerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().url().nullable(),
});
export type LeadBuyer = z.infer<typeof leadBuyerSchema>;

export const leadActivitySchema = z.object({
  id: z.string().uuid(),
  type: leadActivityTypeSchema,
  description: z.string(),
  createdAt: z.string().datetime(),
});
export type LeadActivity = z.infer<typeof leadActivitySchema>;

export const leadSchema = z.object({
  id: z.string().uuid(),
  buyer: leadBuyerSchema,
  sourceProperty: propertySummarySchema.nullable(),
  assignedBroker: brokerSchema.nullable(),
  stage: leadStageSchema,
  score: z.number().int().min(0).max(100),
  temperature: leadTemperatureSchema,
  wonAmount: z.number().positive().nullable(),
  lostReason: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Lead = z.infer<typeof leadSchema>;

export const leadDetailSchema = leadSchema.extend({
  activities: z.array(leadActivitySchema),
});
export type LeadDetail = z.infer<typeof leadDetailSchema>;

export const leadListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  stage: leadStageSchema.optional(),
  assignedBrokerId: z.string().uuid().optional(),
  q: z.string().trim().min(1).optional(),
});
export type LeadListQuery = z.infer<typeof leadListQuerySchema>;

export const updateLeadStageRequestSchema = z.object({
  stage: leadStageSchema,
  lostReason: z.string().trim().max(500).optional(),
  wonAmount: z.number().positive().optional(),
});
export type UpdateLeadStageRequest = z.infer<typeof updateLeadStageRequestSchema>;

export const assignLeadRequestSchema = z.object({
  brokerId: z.string().uuid().nullable(),
});
export type AssignLeadRequest = z.infer<typeof assignLeadRequestSchema>;

export const createLeadNoteRequestSchema = z.object({
  note: z.string().trim().min(1).max(1000),
});
export type CreateLeadNoteRequest = z.infer<typeof createLeadNoteRequestSchema>;
