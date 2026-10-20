import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createInteractionRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { InteractionsService } from "./interactions.service";

@ApiTags("interactions")
@Controller("interactions")
@UseGuards(SessionAuthGuard)
export class InteractionsController {
  constructor(private readonly interactions: InteractionsService) {}

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createInteractionRequestSchema))
    body: ReturnType<typeof createInteractionRequestSchema.parse>,
  ): Promise<{ recorded: true }> {
    await this.interactions.record(userId, body);
    return { recorded: true };
  }
}
