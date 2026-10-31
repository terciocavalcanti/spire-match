import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { campaignListQuerySchema, createCampaignRequestSchema, updateCampaignRequestSchema } from "@spire/contracts";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { CampaignsService } from "./campaigns.service";

const CRM_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("campaigns")
@Controller("campaigns")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...CRM_ROLES)
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(campaignListQuerySchema)) query: ReturnType<typeof campaignListQuerySchema.parse>) {
    return this.campaigns.list(query);
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    return this.campaigns.detail(id);
  }

  @Get(":id/stats")
  async stats(@Param("id") id: string) {
    return this.campaigns.stats(id);
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createCampaignRequestSchema)) body: ReturnType<typeof createCampaignRequestSchema.parse>) {
    return this.campaigns.create(body);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateCampaignRequestSchema)) body: ReturnType<typeof updateCampaignRequestSchema.parse>,
  ) {
    return this.campaigns.update(id, body);
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    await this.campaigns.delete(id);
    return { deleted: true };
  }
}
