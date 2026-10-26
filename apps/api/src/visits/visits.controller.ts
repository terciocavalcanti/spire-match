import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { adminVisitListQuerySchema, createVisitRequestSchema, visitAvailabilityQuerySchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { VisitsService } from "./visits.service";

@ApiTags("visits")
@Controller("visits")
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Get("availability")
  async availability(
    @Query(new ZodValidationPipe(visitAvailabilityQuerySchema)) query: ReturnType<typeof visitAvailabilityQuerySchema.parse>,
  ) {
    const slots = await this.visits.getAvailability(query.brokerId, query.date);
    return { slots };
  }

  @Get("admin")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles("ADMIN", "SUPER_ADMIN", "SALES_MANAGER", "BROKER")
  async adminAgenda(
    @Query(new ZodValidationPipe(adminVisitListQuerySchema)) query: ReturnType<typeof adminVisitListQuerySchema.parse>,
  ) {
    const items = await this.visits.listAll(query);
    return { items };
  }

  @Get("mine")
  @UseGuards(SessionAuthGuard)
  async mine(@CurrentUserId() userId: string) {
    const items = await this.visits.listMine(userId);
    return { items };
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  async schedule(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createVisitRequestSchema)) body: ReturnType<typeof createVisitRequestSchema.parse>,
  ) {
    return this.visits.schedule(userId, body);
  }

  @Delete(":id")
  @UseGuards(SessionAuthGuard)
  async cancel(@CurrentUserId() userId: string, @Param("id") id: string) {
    await this.visits.cancel(userId, id);
    return { cancelled: true };
  }
}
