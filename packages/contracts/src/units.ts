import { z } from "zod";

export const UNIT_STATUSES = ["AVAILABLE", "RESERVED", "SOLD"] as const;
export const unitStatusSchema = z.enum(UNIT_STATUSES);
export type UnitStatus = z.infer<typeof unitStatusSchema>;

export const unitSchema = z.object({
  id: z.string().uuid(),
  developmentId: z.string().uuid(),
  developmentName: z.string(),
  blockId: z.string().uuid().nullable(),
  blockName: z.string().nullable(),
  identifier: z.string(),
  floor: z.number().int().nullable(),
  areaSqm: z.number(),
  bedrooms: z.number().int(),
  parkingSpaces: z.number().int(),
  price: z.number(),
  status: unitStatusSchema,
  propertyId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});
export type Unit = z.infer<typeof unitSchema>;

export const createUnitRequestSchema = z.object({
  developmentId: z.string().uuid(),
  blockId: z.string().uuid().nullable().optional(),
  identifier: z.string().trim().min(1).max(60),
  floor: z.number().int().nullable().optional(),
  areaSqm: z.number().positive(),
  bedrooms: z.number().int().nonnegative().default(0),
  parkingSpaces: z.number().int().nonnegative().default(0),
  price: z.number().positive(),
  status: unitStatusSchema.default("AVAILABLE"),
  propertyId: z.string().uuid().nullable().optional(),
});
export type CreateUnitRequest = z.infer<typeof createUnitRequestSchema>;

export const updateUnitRequestSchema = createUnitRequestSchema.omit({ developmentId: true }).partial();
export type UpdateUnitRequest = z.infer<typeof updateUnitRequestSchema>;

export const adminUnitListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  developmentId: z.string().uuid().optional(),
  status: unitStatusSchema.optional(),
  q: z.string().trim().min(1).optional(),
});
export type AdminUnitListQuery = z.infer<typeof adminUnitListQuerySchema>;

// Importação em lote via CSV — o parsing do arquivo acontece no admin (sem
// infra de upload multipart ainda, ver S3_* pendente em .env). `rows` chega
// solto (unknown) de propósito: o servidor valida linha a linha e importa
// as válidas mesmo quando outras falham (ver ImportUnitsResponse.errors),
// em vez de rejeitar o lote inteiro por causa de uma linha ruim.
export const importUnitsRequestSchema = z.object({
  developmentId: z.string().uuid(),
  rows: z.array(z.record(z.string(), z.unknown())).min(1).max(500),
});
export type ImportUnitsRequest = z.infer<typeof importUnitsRequestSchema>;

export const importUnitsResponseSchema = z.object({
  imported: z.number().int().nonnegative(),
  errors: z.array(z.object({ row: z.number().int(), message: z.string() })),
});
export type ImportUnitsResponse = z.infer<typeof importUnitsResponseSchema>;
