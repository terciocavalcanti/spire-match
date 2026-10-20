import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { propertyNearbyQuerySchema, propertySearchQuerySchema } from "@spire/contracts";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { PropertiesService } from "./properties.service";

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

  @Get()
  async search(
    @Query(new ZodValidationPipe(propertySearchQuerySchema)) query: ReturnType<typeof propertySearchQuerySchema.parse>,
  ) {
    return this.properties.search(query);
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
