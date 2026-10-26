import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createRadarRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { RadarsService } from "./radars.service";

@ApiTags("radars")
@Controller("radars")
@UseGuards(SessionAuthGuard)
export class RadarsController {
  constructor(private readonly radars: RadarsService) {}

  @Get()
  async list(@CurrentUserId() userId: string) {
    const items = await this.radars.listMine(userId);
    return { items };
  }

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createRadarRequestSchema)) body: ReturnType<typeof createRadarRequestSchema.parse>,
  ) {
    return this.radars.create(userId, body);
  }

  @Post(":id/check")
  async check(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.radars.check(userId, id);
  }

  @Delete(":id")
  async remove(@CurrentUserId() userId: string, @Param("id") id: string) {
    await this.radars.remove(userId, id);
    return { removed: true };
  }
}
