import { z } from "zod";

import { roleSchema } from "./common";

// Papéis geridos pela tela "Usuários" (D1) — contas internas/equipe. BUYER,
// OWNER e VISITOR pertencem ao autocadastro público, não a este módulo.
export const STAFF_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER", "BROKER", "DEVELOPER_PARTNER"] as const;

export const adminUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(["ACTIVE", "SUSPENDED", "DELETED"]),
  roles: z.array(roleSchema),
  mustChangePassword: z.boolean(),
  createdAt: z.string().datetime(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

export const createAdminUserRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email(),
  roles: z.array(roleSchema).min(1, "Selecione ao menos um papel"),
});
export type CreateAdminUserRequest = z.infer<typeof createAdminUserRequestSchema>;

// A senha temporária só é retornada nesta resposta de criação — uma única
// vez — e nunca fica persistida em texto puro nem é reexibida depois.
export const createAdminUserResponseSchema = adminUserSchema.extend({
  temporaryPassword: z.string(),
});
export type CreateAdminUserResponse = z.infer<typeof createAdminUserResponseSchema>;

export const updateAdminUserRolesRequestSchema = z.object({
  roles: z.array(roleSchema).min(1, "Selecione ao menos um papel"),
});
export type UpdateAdminUserRolesRequest = z.infer<typeof updateAdminUserRolesRequestSchema>;

export const adminUserListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  q: z.string().trim().min(1).optional(),
});
export type AdminUserListQuery = z.infer<typeof adminUserListQuerySchema>;
