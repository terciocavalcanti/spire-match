import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { BrokersService } from "./brokers.service";

@ApiTags("brokers")
@Controller("brokers")
export class BrokersController {
  constructor(private readonly brokers: BrokersService) {}

  @Get()
  async list() {
    const items = await this.brokers.list();
    return { items };
  }

  @Get("by-property/:propertyId")
  async byProperty(@Param("propertyId") propertyId: string) {
    const broker = await this.brokers.getForProperty(propertyId);
    return { broker };
  }

  @Get(":id")
  async byId(@Param("id") id: string) {
    return this.brokers.getById(id);
  }
}
