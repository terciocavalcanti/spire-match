import { z } from "zod";

// LGPD (seção 16, Marco F) — solicitações de titular de dados. EXPORTACAO é
// self-service e instantânea (o próprio comprador baixa os dados na hora);
// EXCLUSAO exige confirmação do time comercial (ação irreversível).
export const DATA_SUBJECT_REQUEST_TYPES = ["EXPORTACAO", "EXCLUSAO"] as const;
export const dataSubjectRequestTypeSchema = z.enum(DATA_SUBJECT_REQUEST_TYPES);
export type DataSubjectRequestType = z.infer<typeof dataSubjectRequestTypeSchema>;

export const DATA_SUBJECT_REQUEST_STATUSES = ["PENDENTE", "CONCLUIDO", "REJEITADO"] as const;
export const dataSubjectRequestStatusSchema = z.enum(DATA_SUBJECT_REQUEST_STATUSES);
export type DataSubjectRequestStatus = z.infer<typeof dataSubjectRequestStatusSchema>;

export const dataSubjectRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  userEmail: z.string().email(),
  type: dataSubjectRequestTypeSchema,
  status: dataSubjectRequestStatusSchema,
  requestedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  handledByUserId: z.string().uuid().nullable(),
  rejectionReason: z.string().nullable(),
});
export type DataSubjectRequest = z.infer<typeof dataSubjectRequestSchema>;

export const createDataSubjectRequestRequestSchema = z.object({
  type: dataSubjectRequestTypeSchema,
});
export type CreateDataSubjectRequestRequest = z.infer<typeof createDataSubjectRequestRequestSchema>;

export const resolveDataSubjectRequestRequestSchema = z.object({
  status: z.enum(["CONCLUIDO", "REJEITADO"]),
  rejectionReason: z.string().trim().max(500).optional(),
});
export type ResolveDataSubjectRequestRequest = z.infer<typeof resolveDataSubjectRequestRequestSchema>;
