import { type CanActivate, type ExecutionContext, ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Role } from "@spire/contracts";
import { eq } from "drizzle-orm";

import type { AuthenticatedRequest } from "../../auth/guards/session-auth.guard";
import type { Database } from "../../database/client";
import { DATABASE } from "../../database/database.module";
import { roleAssignments, roles } from "../../database/schema";
import { ROLES_KEY } from "../decorators/roles.decorator";

/**
 * Deve rodar depois de SessionAuthGuard (`@UseGuards(SessionAuthGuard, RolesGuard)`):
 * depende de `request.userId`. Sem `@Roles(...)` na rota, deixa passar — RBAC é
 * opt-in por rota, não um bloqueio global.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(DATABASE) private readonly db: Database,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const assigned = await this.db
      .select({ name: roles.name })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(eq(roleAssignments.userId, request.userId));

    const userRoles = assigned.map((r) => r.name);
    const allowed = required.some((role) => userRoles.includes(role));
    if (!allowed) {
      throw new ForbiddenException({ code: "FORBIDDEN_ROLE", message: "Você não tem permissão para esta ação" });
    }
    return true;
  }
}
