import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createContactRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { ContactsService } from "./contacts.service";

@ApiTags("contacts")
@Controller("contacts")
@UseGuards(SessionAuthGuard)
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get("mine")
  async mine(@CurrentUserId() userId: string) {
    const items = await this.contacts.listMine(userId);
    return { items };
  }

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createContactRequestSchema)) body: ReturnType<typeof createContactRequestSchema.parse>,
  ) {
    return this.contacts.create(userId, body);
  }
}
