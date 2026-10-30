import { z } from "zod";

export const COMMISSION_STATUSES = ["PREVISTO", "RECEBIDO", "CANCELADO"] as const;
export const commissionStatusSchema = z.enum(COMMISSION_STATUSES);
export type CommissionStatus = z.infer<typeof commissionStatusSchema>;

export const commissionSchema = z.object({
  id: z.string().uuid(),
  leadId: z.string().uuid(),
  buyerName: z.string(),
  brokerId: z.string().uuid().nullable(),
  brokerName: z.string().nullable(),
  propertyId: z.string().uuid().nullable(),
  propertyTitle: z.string().nullable(),
  baseAmount: z.number(),
  rate: z.number(),
  previstoAmount: z.number(),
  recebidoAmount: z.number().nullable(),
  recebidoAt: z.string().datetime().nullable(),
  status: commissionStatusSchema,
  createdAt: z.string().datetime(),
});
export type Commission = z.infer<typeof commissionSchema>;

export const commissionListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  status: commissionStatusSchema.optional(),
  brokerId: z.string().uuid().optional(),
});
export type CommissionListQuery = z.infer<typeof commissionListQuerySchema>;

export const markCommissionReceivedRequestSchema = z.object({
  recebidoAmount: z.number().positive(),
  recebidoAt: z.string().datetime().optional(),
});
export type MarkCommissionReceivedRequest = z.infer<typeof markCommissionReceivedRequestSchema>;

export const commissionsSummarySchema = z.object({
  vgv: z.number().nonnegative(),
  previstoTotal: z.number().nonnegative(),
  recebidoTotal: z.number().nonnegative(),
  previstoCount: z.number().int().nonnegative(),
  recebidoCount: z.number().int().nonnegative(),
});
export type CommissionsSummary = z.infer<typeof commissionsSummarySchema>;
