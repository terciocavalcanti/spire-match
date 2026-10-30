import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  adminUnitListQuerySchema,
  createUnitRequestSchema,
  importUnitsRequestSchema,
  updateUnitRequestSchema,
} from "@spire/contracts";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { UnitsService } from "./units.service";

const ADMIN_CATALOG_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("units")
@Controller("units")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...ADMIN_CATALOG_ROLES)
export class UnitsController {
  constructor(private readonly units: UnitsService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(adminUnitListQuerySchema)) query: ReturnType<typeof adminUnitListQuerySchema.parse>) {
    return this.units.list(query);
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createUnitRequestSchema)) body: ReturnType<typeof createUnitRequestSchema.parse>) {
    return this.units.create(body);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateUnitRequestSchema)) body: ReturnType<typeof updateUnitRequestSchema.parse>,
  ) {
    return this.units.update(id, body);
  }

  @Post("import")
  async importRows(@Body(new ZodValidationPipe(importUnitsRequestSchema)) body: ReturnType<typeof importUnitsRequestSchema.parse>) {
    return this.units.importRows(body.developmentId, body.rows);
  }
}
