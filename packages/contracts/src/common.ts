import { z } from "zod";

// RBAC mínimo exigido pelo prompt mestre (seção 11).
export const ROLES = [
  "VISITOR",
  "BUYER",
  "OWNER",
  "BROKER",
  "SALES_MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
  "DEVELOPER_PARTNER",
] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

// Finalidades de consentimento distintas (seção 4.1).
export const CONSENT_PURPOSES = [
  "EMAIL",
  "WHATSAPP",
  "WEB_PUSH",
  "LOCATION",
  "MARKETING",
  "CAMPAIGNS",
] as const;
export const consentPurposeSchema = z.enum(CONSENT_PURPOSES);
export type ConsentPurpose = z.infer<typeof consentPurposeSchema>;

export const paginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginatedEnvelope = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
    total: z.number().int().nonnegative().optional(),
  });

export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(), // ex.: "VALIDATION_ERROR", "NOT_FOUND", "FORBIDDEN"
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  requestId: z.string().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
