import { SetMetadata } from "@nestjs/common";
import type { Role } from "@spire/contracts";

export const ROLES_KEY = "roles";

/** Restringe uma rota aos papéis informados — usar sempre junto de SessionAuthGuard (precisa de request.userId). */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
