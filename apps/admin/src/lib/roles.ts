import type { Role } from "@spire/contracts";

/** Quem pode entrar no painel comercial — espelha os papéis aceitos pelas rotas admin da API. */
export const ADMIN_ACCESS_ROLES: Role[] = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER", "BROKER", "DEVELOPER_PARTNER"];

export function hasAdminAccess(roles: Role[] | undefined): boolean {
  if (!roles) return false;
  return roles.some((role) => ADMIN_ACCESS_ROLES.includes(role));
}

/** Incorporadora (DEVELOPER_PARTNER) só enxerga seus próprios resultados — sem nenhum outro papel comercial. */
export function isDeveloperPartnerOnly(roles: Role[] | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  return roles.includes("DEVELOPER_PARTNER") && !roles.some((role) => role !== "DEVELOPER_PARTNER" && ADMIN_ACCESS_ROLES.includes(role));
}
