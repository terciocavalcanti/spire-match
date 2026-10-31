import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createDataSubjectRequestRequestSchema, resolveDataSubjectRequestRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { DataSubjectRequestsService } from "./data-subject-requests.service";

// Mesmo nível de Auditoria/Configurações — restrito a ADMIN/SUPER_ADMIN.
const PRIVACY_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

@ApiTags("data-subject-requests")
@Controller("me/data-requests")
@UseGuards(SessionAuthGuard)
export class MeDataRequestsController {
  constructor(private readonly requests: DataSubjectRequestsService) {}

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createDataSubjectRequestRequestSchema)) body: ReturnType<typeof createDataSubjectRequestRequestSchema.parse>,
  ) {
    return this.requests.create(userId, body);
  }

  @Get()
  async listMine(@CurrentUserId() userId: string) {
    const items = await this.requests.listMine(userId);
    return { items };
  }
}

@ApiTags("data-subject-requests")
@Controller("data-subject-requests")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...PRIVACY_ROLES)
export class DataSubjectRequestsController {
  constructor(private readonly requests: DataSubjectRequestsService) {}

  @Get()
  async list() {
    const items = await this.requests.list();
    return { items };
  }

  @Patch(":id")
  async resolve(
    @Param("id") id: string,
    @CurrentUserId() actorUserId: string,
    @Body(new ZodValidationPipe(resolveDataSubjectRequestRequestSchema)) body: ReturnType<typeof resolveDataSubjectRequestRequestSchema.parse>,
  ) {
    return this.requests.resolve(id, body, actorUserId);
  }
}
