import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  adminPropertyListQuerySchema,
  createPropertyRequestSchema,
  propertyNearbyQuerySchema,
  propertySearchQuerySchema,
  updatePropertyRequestSchema,
} from "@spire/contracts";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { PropertiesService } from "./properties.service";

const ADMIN_CATALOG_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("properties")
@Controller("properties")
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  // Rota literal precisa vir antes de ":slug" (seção 9 do prompt mestre).
  @Get("nearby")
  async nearby(
    @Query(new ZodValidationPipe(propertyNearbyQuerySchema)) query: ReturnType<typeof propertyNearbyQuerySchema.parse>,
  ) {
    const items = await this.properties.nearby(query);
    return { items };
  }

  @Get("admin")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...ADMIN_CATALOG_ROLES)
  async adminList(
    @Query(new ZodValidationPipe(adminPropertyListQuerySchema)) query: ReturnType<typeof adminPropertyListQuerySchema.parse>,
  ) {
    return this.properties.adminList(query);
  }

  @Post("admin")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...ADMIN_CATALOG_ROLES)
  async adminCreate(
    @Body(new ZodValidationPipe(createPropertyRequestSchema)) body: ReturnType<typeof createPropertyRequestSchema.parse>,
  ) {
    return this.properties.adminCreate(body);
  }

  @Patch("admin/:id")
  @UseGuards(SessionAuthGuard, RolesGuard)
  @Roles(...ADMIN_CATALOG_ROLES)
  async adminUpdate(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(updatePropertyRequestSchema)) body: ReturnType<typeof updatePropertyRequestSchema.parse>,
  ) {
    return this.properties.adminUpdate(id, body);
  }

  @Get()
  async search(
    @Query(new ZodValidationPipe(propertySearchQuerySchema)) query: ReturnType<typeof propertySearchQuerySchema.parse>,
  ) {
    return this.properties.search(query);
  }

  // Idem — usada por telas que só têm o UUID (atendimento, visitas, tour).
  @Get("by-id/:id")
  async findById(@Param("id") id: string) {
    const property = await this.properties.findByIdDetail(id);
    if (!property) {
      throw new NotFoundException({ code: "PROPERTY_NOT_FOUND", message: "Imóvel não encontrado" });
    }
    return property;
  }

  @Get(":slug")
  async findBySlug(@Param("slug") slug: string) {
    const property = await this.properties.findBySlug(slug);
    if (!property) {
      throw new NotFoundException({ code: "PROPERTY_NOT_FOUND", message: "Imóvel não encontrado" });
    }
    return property;
  }
}
