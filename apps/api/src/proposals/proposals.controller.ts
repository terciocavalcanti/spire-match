import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createProposalRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { ProposalsService } from "./proposals.service";

@ApiTags("proposals")
@Controller("proposals")
@UseGuards(SessionAuthGuard)
export class ProposalsController {
  constructor(private readonly proposals: ProposalsService) {}

  @Get("mine")
  async mine(@CurrentUserId() userId: string) {
    const items = await this.proposals.listMine(userId);
    return { items };
  }

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createProposalRequestSchema)) body: ReturnType<typeof createProposalRequestSchema.parse>,
  ) {
    return this.proposals.create(userId, body);
  }
}
