import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  adminReportsQuerySchema,
  assignLeadRequestSchema,
  createLeadNoteRequestSchema,
  leadListQuerySchema,
  updateLeadStageRequestSchema,
} from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { LeadsService } from "./leads.service";

const CRM_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER", "BROKER"] as const;

@ApiTags("leads")
@Controller("leads")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...CRM_ROLES)
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  // Rotas literais precisam vir antes de ":id".
  @Get("overview")
  async overview() {
    return this.leads.overview();
  }

  @Get("funnel-report")
  async funnelReport(
    @Query(new ZodValidationPipe(adminReportsQuerySchema)) query: ReturnType<typeof adminReportsQuerySchema.parse>,
  ) {
    return this.leads.funnelReport(query.days);
  }

  @Get()
  async list(@Query(new ZodValidationPipe(leadListQuerySchema)) query: ReturnType<typeof leadListQuerySchema.parse>) {
    return this.leads.list(query);
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    return this.leads.getDetail(id);
  }

  @Patch(":id/stage")
  async updateStage(
    @Param("id") id: string,
    @CurrentUserId() actorUserId: string,
    @Body(new ZodValidationPipe(updateLeadStageRequestSchema)) body: ReturnType<typeof updateLeadStageRequestSchema.parse>,
  ) {
    return this.leads.updateStage(id, body, actorUserId);
  }

  @Patch(":id/assign")
  async assign(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(assignLeadRequestSchema)) body: ReturnType<typeof assignLeadRequestSchema.parse>,
  ) {
    return this.leads.assign(id, body);
  }

  @Post(":id/notes")
  async addNote(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createLeadNoteRequestSchema)) body: ReturnType<typeof createLeadNoteRequestSchema.parse>,
  ) {
    return this.leads.addNote(id, body.note);
  }
}
