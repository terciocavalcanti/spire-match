import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { grantDevelopmentPartnerAccessRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { DevelopmentPartnerAccessService } from "./development-partner-access.service";

const CRM_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("development-partner-access")
@Controller("development-partner-access")
export class DevelopmentPartnerAccessController {
  constructor(private readonly access: DevelopmentPartnerAccessService) {}

  @Get("mine")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles("DEVELOPER_PARTNER")
  async mine(@CurrentUserId() userId: string) {
    const items = await this.access.listMine(userId);
    return { items };
  }

  @Get()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async list() {
    const items = await this.access.list();
    return { items };
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async grant(
    @CurrentUserId() grantedByUserId: string,
    @Body(new ZodValidationPipe(grantDevelopmentPartnerAccessRequestSchema)) body: ReturnType<typeof grantDevelopmentPartnerAccessRequestSchema.parse>,
  ) {
    return this.access.grant(body, grantedByUserId);
  }

  @Delete(":id")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async revoke(@Param("id") id: string, @CurrentUserId() actorUserId: string) {
    await this.access.revoke(id, actorUserId);
    return { revoked: true };
  }
}
