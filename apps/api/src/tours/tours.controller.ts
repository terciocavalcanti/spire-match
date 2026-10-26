import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { generateTourRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { ToursService } from "./tours.service";

@ApiTags("tours")
@Controller("tours")
@UseGuards(SessionAuthGuard)
export class ToursController {
  constructor(private readonly tours: ToursService) {}

  @Post("generate")
  async generate(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(generateTourRequestSchema)) body: ReturnType<typeof generateTourRequestSchema.parse>,
  ) {
    return this.tours.generate(userId, body);
  }
}
