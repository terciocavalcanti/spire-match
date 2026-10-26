import type { Role } from "@spire/contracts";

/** Quem pode entrar no painel comercial — espelha os papéis aceitos pelas rotas admin da API. */
export const ADMIN_ACCESS_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER", "BROKER"];

export function hasAdminAccess(roles: Role[] | undefined): boolean {
  if (!roles) return false;
  return roles.some((role) => ADMIN_ACCESS_ROLES.includes(role));
}
