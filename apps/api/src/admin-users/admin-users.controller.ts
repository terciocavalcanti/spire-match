import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { adminUserListQuerySchema, createAdminUserRequestSchema, updateAdminUserRolesRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { AdminUsersService } from "./admin-users.service";

// Gestão de papel é sensível — só ADMIN/SUPER_ADMIN, diferente do
// ADMIN_CATALOG_ROLES (que também inclui SALES_MANAGER) usado em outros
// módulos administrativos.
const USER_MANAGEMENT_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

@ApiTags("admin-users")
@Controller("admin-users")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...USER_MANAGEMENT_ROLES)
export class AdminUsersController {
  constructor(private readonly adminUsers: AdminUsersService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(adminUserListQuerySchema)) query: ReturnType<typeof adminUserListQuerySchema.parse>) {
    return this.adminUsers.list(query);
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createAdminUserRequestSchema)) body: ReturnType<typeof createAdminUserRequestSchema.parse>) {
    return this.adminUsers.create(body);
  }

  @Patch(":id/roles")
  async updateRoles(
    @Param("id") id: string,
    @CurrentUserId() actorUserId: string,
    @Body(new ZodValidationPipe(updateAdminUserRolesRequestSchema)) body: ReturnType<typeof updateAdminUserRolesRequestSchema.parse>,
  ) {
    return this.adminUsers.updateRoles(id, body.roles, actorUserId);
  }

  @Post(":id/revoke-sessions")
  async revokeSessions(@Param("id") id: string) {
    await this.adminUsers.revokeSessions(id);
    return { revoked: true };
  }

  @Post(":id/suspend")
  async suspend(@Param("id") id: string, @CurrentUserId() actorUserId: string) {
    return this.adminUsers.setStatus(id, "SUSPENDED", actorUserId);
  }

  @Post(":id/reactivate")
  async reactivate(@Param("id") id: string, @CurrentUserId() actorUserId: string) {
    return this.adminUsers.setStatus(id, "ACTIVE", actorUserId);
  }
}
