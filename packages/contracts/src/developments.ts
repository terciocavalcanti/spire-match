import { z } from "zod";

export const DEVELOPMENT_STATUSES = ["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"] as const;
export const developmentStatusSchema = z.enum(DEVELOPMENT_STATUSES);
export type DevelopmentStatus = z.infer<typeof developmentStatusSchema>;

export const developmentBlockSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type DevelopmentBlock = z.infer<typeof developmentBlockSchema>;

export const developmentSummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  status: developmentStatusSchema,
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  coverImageUrl: z.string().url().nullable(),
  priceFrom: z.number().nullable(),
  deliveryDate: z.string().nullable(),
  unitsCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});
export type DevelopmentSummary = z.infer<typeof developmentSummarySchema>;

export const developmentDetailSchema = developmentSummarySchema.extend({
  description: z.string(),
  incorporatorName: z.string().nullable(),
  blocks: z.array(developmentBlockSchema),
});
export type DevelopmentDetail = z.infer<typeof developmentDetailSchema>;

export const createDevelopmentRequestSchema = z.object({
  name: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).default(""),
  status: developmentStatusSchema.default("DRAFT"),
  incorporatorName: z.string().trim().max(200).nullable().optional(),
  neighborhood: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().length(2),
  coverImageUrl: z.string().url().nullable().optional(),
  priceFrom: z.number().positive().nullable().optional(),
  deliveryDate: z.string().nullable().optional(),
});
export type CreateDevelopmentRequest = z.infer<typeof createDevelopmentRequestSchema>;

export const updateDevelopmentRequestSchema = createDevelopmentRequestSchema.partial();
export type UpdateDevelopmentRequest = z.infer<typeof updateDevelopmentRequestSchema>;

export const adminDevelopmentListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  status: developmentStatusSchema.optional(),
  q: z.string().trim().min(1).optional(),
});
export type AdminDevelopmentListQuery = z.infer<typeof adminDevelopmentListQuerySchema>;

export const createDevelopmentBlockRequestSchema = z.object({
  name: z.string().trim().min(1).max(120),
});
export type CreateDevelopmentBlockRequest = z.infer<typeof createDevelopmentBlockRequestSchema>;
