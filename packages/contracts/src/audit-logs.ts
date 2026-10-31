import { z } from "zod";

// Trilha de auditoria (seção 16, Marco F) — cobre um conjunto delimitado de
// ações privilegiadas (não todo CRUD): mudança de papel/status de usuário,
// lead indo para GANHO/PERDIDO, captação publicada no catálogo, oferta do
// Mercado Privado verificada, configurações da plataforma, acesso de
// incorporadora e as próprias ações de LGPD (exportar/excluir dados).
export const auditLogSchema = z.object({
  id: z.string().uuid(),
  actorUserId: z.string().uuid().nullable(),
  actorEmail: z.string().nullable(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string().uuid().nullable(),
  metadata: z.record(z.string(), z.unknown()).nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type AuditLog = z.infer<typeof auditLogSchema>;

export const auditLogListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  action: z.string().trim().min(1).optional(),
  entityType: z.string().trim().min(1).optional(),
  actorUserId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type AuditLogListQuery = z.infer<typeof auditLogListQuerySchema>;
