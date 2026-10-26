import { z } from "zod";

import { paymentMethodSchema, propertySummarySchema } from "./property";

export const PROPOSAL_STATUSES = ["PENDING", "ACCEPTED", "REJECTED", "COUNTERED", "WITHDRAWN"] as const;
export const proposalStatusSchema = z.enum(PROPOSAL_STATUSES);
export type ProposalStatus = z.infer<typeof proposalStatusSchema>;

export const proposalSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  property: propertySummarySchema,
  amount: z.number().positive(),
  paymentMethod: paymentMethodSchema,
  message: z.string().nullable(),
  status: proposalStatusSchema,
  createdAt: z.string().datetime(),
});
export type Proposal = z.infer<typeof proposalSchema>;

export const createProposalRequestSchema = z.object({
  propertyId: z.string().uuid(),
  amount: z.number().positive(),
  paymentMethod: paymentMethodSchema,
  message: z.string().trim().max(1000).optional(),
});
export type CreateProposalRequest = z.infer<typeof createProposalRequestSchema>;
