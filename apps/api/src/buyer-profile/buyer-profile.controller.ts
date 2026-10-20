import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { updateBuyerPreferencesRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { BuyerProfileService } from "./buyer-profile.service";

@ApiTags("buyer-profile")
@Controller("me/preferences")
@UseGuards(SessionAuthGuard)
export class BuyerProfileController {
  constructor(private readonly buyerProfile: BuyerProfileService) {}

  @Get()
  async get(@CurrentUserId() userId: string) {
    return this.buyerProfile.get(userId);
  }

  @Put()
  async update(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateBuyerPreferencesRequestSchema))
    body: ReturnType<typeof updateBuyerPreferencesRequestSchema.parse>,
  ) {
    return this.buyerProfile.update(userId, body);
  }
}
