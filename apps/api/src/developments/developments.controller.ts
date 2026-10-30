import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  adminDevelopmentListQuerySchema,
  createDevelopmentBlockRequestSchema,
  createDevelopmentRequestSchema,
  updateDevelopmentRequestSchema,
} from "@spire/contracts";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { DevelopmentsService } from "./developments.service";

const ADMIN_CATALOG_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("developments")
@Controller("developments")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...ADMIN_CATALOG_ROLES)
export class DevelopmentsController {
  constructor(private readonly developments: DevelopmentsService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(adminDevelopmentListQuerySchema)) query: ReturnType<typeof adminDevelopmentListQuerySchema.parse>) {
    return this.developments.list(query);
  }

  @Post()
  async create(@Body(new ZodValidationPipe(createDevelopmentRequestSchema)) body: ReturnType<typeof createDevelopmentRequestSchema.parse>) {
    return this.developments.create(body);
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    return this.developments.getDetail(id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updateDevelopmentRequestSchema)) body: ReturnType<typeof updateDevelopmentRequestSchema.parse>,
  ) {
    return this.developments.update(id, body);
  }

  @Post(":id/blocks")
  async addBlock(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(createDevelopmentBlockRequestSchema)) body: ReturnType<typeof createDevelopmentBlockRequestSchema.parse>,
  ) {
    return this.developments.addBlock(id, body);
  }

  @Delete(":id/blocks/:blockId")
  async removeBlock(@Param("id") id: string, @Param("blockId") blockId: string) {
    await this.developments.removeBlock(id, blockId);
    return { removed: true };
  }
}
