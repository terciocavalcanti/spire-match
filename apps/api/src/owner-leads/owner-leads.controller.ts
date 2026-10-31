import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  assignOwnerLeadRequestSchema,
  createOwnerLeadNoteRequestSchema,
  createOwnerLeadRequestSchema,
  ownerLeadListQuerySchema,
  publishOwnerLeadRequestSchema,
  updateOwnerLeadStageRequestSchema,
} from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { OwnerLeadsService } from "./owner-leads.service";

const CRM_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("owner-leads")
@Controller("owner-leads")
export class OwnerLeadsController {
  constructor(private readonly ownerLeads: OwnerLeadsService) {}

  @Post()
  @UseGuards(SessionAuthGuard)
  async create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createOwnerLeadRequestSchema)) body: ReturnType<typeof createOwnerLeadRequestSchema.parse>,
  ) {
    return this.ownerLeads.create(userId, body);
  }

  @Get("mine")
  @UseGuards(SessionAuthGuard)
  async listMine(@CurrentUserId() userId: string) {
    const items = await this.ownerLeads.listMine(userId);
    return { items };
  }

  @Get()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async list(@Query(new ZodValidationPipe(ownerLeadListQuerySchema)) query: ReturnType<typeof ownerLeadListQuerySchema.parse>) {
    return this.ownerLeads.list(query);
  }

  @Get(":id")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async detail(@Param("id") id: string) {
    return this.ownerLeads.getDetail(id);
  }

  @Patch(":id/stage")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async updateStage(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateOwnerLeadStageRequestSchema)) body: ReturnType<typeof updateOwnerLeadStageRequestSchema.parse>,
  ) {
    return this.ownerLeads.updateStage(id, body);
  }

  @Patch(":id/assign")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async assign(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(assignOwnerLeadRequestSchema)) body: ReturnType<typeof assignOwnerLeadRequestSchema.parse>,
  ) {
    return this.ownerLeads.assign(id, body);
  }

  @Post(":id/notes")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async addNote(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createOwnerLeadNoteRequestSchema)) body: ReturnType<typeof createOwnerLeadNoteRequestSchema.parse>,
  ) {
    return this.ownerLeads.addNote(id, body.note);
  }

  @Post(":id/publish")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async publish(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(publishOwnerLeadRequestSchema)) body: ReturnType<typeof publishOwnerLeadRequestSchema.parse>,
  ) {
    return this.ownerLeads.publish(id, body);
  }
}
