import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createMarketIndicatorRequestSchema, updateMarketIndicatorRequestSchema } from "@spire/contracts";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { MarketIndicatorsService } from "./market-indicators.service";

const CRM_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("market-indicators")
@Controller("market-indicators")
export class MarketIndicatorsController {
  constructor(private readonly marketIndicators: MarketIndicatorsService) {}

  /** Público — alimenta o Pulse no app do comprador, só indicadores ativos. */
  @Get()
  async listActive() {
    const items = await this.marketIndicators.listActive();
    return { items };
  }

  @Get("admin")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async list() {
    const items = await this.marketIndicators.list();
    return { items };
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async create(@Body(new ZodValidationPipe(createMarketIndicatorRequestSchema)) body: ReturnType<typeof createMarketIndicatorRequestSchema.parse>) {
    return this.marketIndicators.create(body);
  }

  @Patch(":id")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateMarketIndicatorRequestSchema)) body: ReturnType<typeof updateMarketIndicatorRequestSchema.parse>,
  ) {
    return this.marketIndicators.update(id, body);
  }

  @Delete(":id")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...CRM_ROLES)
  async remove(@Param("id") id: string) {
    await this.marketIndicators.delete(id);
    return { deleted: true };
  }
}
