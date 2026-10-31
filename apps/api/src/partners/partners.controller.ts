import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createPartnerRequestSchema, updatePartnerRequestSchema } from "@spire/contracts";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { PartnersService } from "./partners.service";

const CRM_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("partners")
@Controller("partners")
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  /** Público — diretório do Club no app do comprador. */
  @Get()
  async listActive() {
    const items = await this.partners.listActive();
    return { items };
  }

  @Get("admin")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async list() {
    const items = await this.partners.list();
    return { items };
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async create(@Body(new ZodValidationPipe(createPartnerRequestSchema)) body: ReturnType<typeof createPartnerRequestSchema.parse>) {
    return this.partners.create(body);
  }

  @Patch(":id")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updatePartnerRequestSchema)) body: ReturnType<typeof updatePartnerRequestSchema.parse>,
  ) {
    return this.partners.update(id, body);
  }

  @Delete(":id")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async remove(@Param("id") id: string) {
    await this.partners.delete(id);
    return { deleted: true };
  }
}
