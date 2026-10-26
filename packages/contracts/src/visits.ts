import { z } from "zod";

import { brokerSchema } from "./brokers";
import { propertySummarySchema } from "./property";

export const VISIT_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED"] as const;
export const visitStatusSchema = z.enum(VISIT_STATUSES);
export type VisitStatus = z.infer<typeof visitStatusSchema>;

export const visitBuyerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
});
export type VisitBuyer = z.infer<typeof visitBuyerSchema>;

export const visitSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  property: propertySummarySchema,
  brokerId: z.string().uuid(),
  broker: brokerSchema,
  scheduledAt: z.string().datetime(),
  status: visitStatusSchema,
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  // Presente só nas rotas administrativas (agenda) — nas rotas "mine" do
  // comprador seria redundante (o comprador é sempre ele mesmo).
  buyer: visitBuyerSchema.optional(),
});
export type Visit = z.infer<typeof visitSchema>;

export const createVisitRequestSchema = z.object({
  propertyId: z.string().uuid(),
  brokerId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  notes: z.string().trim().max(1000).optional(),
});
export type CreateVisitRequest = z.infer<typeof createVisitRequestSchema>;

export const visitAvailabilityQuerySchema = z.object({
  brokerId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato AAAA-MM-DD"),
});
export type VisitAvailabilityQuery = z.infer<typeof visitAvailabilityQuerySchema>;

// --- Administração (agenda de todos os corretores, Marco D) ---
export const adminVisitListQuerySchema = z.object({
  brokerId: z.string().uuid().optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type AdminVisitListQuery = z.infer<typeof adminVisitListQuerySchema>;

export const visitSlotSchema = z.object({
  time: z.string(), // "HH:mm" em horário local do imóvel (America/Recife)
  available: z.boolean(),
});
export type VisitSlot = z.infer<typeof visitSlotSchema>;
