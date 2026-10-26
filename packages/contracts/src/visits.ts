import { z } from "zod";

import { brokerSchema } from "./brokers";
import { propertySummarySchema } from "./property";

export const VISIT_STATUSES = ["SCHEDULED", "COMPLETED", "CANCELLED"] as const;
export const visitStatusSchema = z.enum(VISIT_STATUSES);
export type VisitStatus = z.infer<typeof visitStatusSchema>;

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

export const visitSlotSchema = z.object({
  time: z.string(), // "HH:mm" em horário local do imóvel (America/Recife)
  available: z.boolean(),
});
export type VisitSlot = z.infer<typeof visitSlotSchema>;
