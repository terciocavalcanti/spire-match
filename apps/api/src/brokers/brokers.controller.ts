import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createBrokerRequestSchema, updateBrokerRequestSchema } from "@spire/contracts";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { BrokersService } from "./brokers.service";

const ADMIN_CATALOG_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("brokers")
@Controller("brokers")
export class BrokersController {
  constructor(private readonly brokers: BrokersService) {}

  @Get()
  async list() {
    const items = await this.brokers.list();
    return { items };
  }

  @Post()
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...ADMIN_CATALOG_ROLES)
  async create(
    @Body(new ZodValidationPipe(createBrokerRequestSchema)) body: ReturnType<typeof createBrokerRequestSchema.parse>,
  ) {
    return this.brokers.create(body);
  }

  @Get("by-property/:propertyId")
  async byProperty(@Param("propertyId") propertyId: string) {
    const broker = await this.brokers.getForProperty(propertyId);
    return { broker };
  }

  @Patch(":id")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...ADMIN_CATALOG_ROLES)
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateBrokerRequestSchema)) body: ReturnType<typeof updateBrokerRequestSchema.parse>,
  ) {
    return this.brokers.update(id, body);
  }

  @Get(":id")
  async byId(@Param("id") id: string) {
    return this.brokers.getById(id);
  }
}
