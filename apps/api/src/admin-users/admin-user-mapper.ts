import type { AdminUser, Role } from "@spire/contracts";

import type { users } from "../database/schema";

type UserRow = typeof users.$inferSelect;

export function toAdminUser(row: UserRow, roles: Role[]): AdminUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    status: row.status,
    roles,
    mustChangePassword: row.mustChangePassword,
    createdAt: row.createdAt.toISOString(),
  };
}
