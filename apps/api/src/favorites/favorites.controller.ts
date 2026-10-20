import { Body, Controller, Delete, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { addFavoriteRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { FavoritesService } from "./favorites.service";

@ApiTags("favorites")
@Controller("favorites")
@UseGuards(SessionAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  async list(@CurrentUserId() userId: string) {
    const items = await this.favorites.list(userId);
    return { items };
  }

  @Post()
  async add(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(addFavoriteRequestSchema)) body: ReturnType<typeof addFavoriteRequestSchema.parse>,
  ): Promise<{ added: true }> {
    await this.favorites.add(userId, body.propertyId);
    return { added: true };
  }

  @Delete(":propertyId")
  async remove(@CurrentUserId() userId: string, @Param("propertyId") propertyId: string): Promise<{ removed: true }> {
    await this.favorites.remove(userId, propertyId);
    return { removed: true };
  }
}
