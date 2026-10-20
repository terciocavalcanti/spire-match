import { Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { matchQuerySchema, recalculateMatchesRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { MatchesService } from "./matches.service";

function toLocation(lat?: number, lng?: number) {
  return lat !== undefined && lng !== undefined ? { lat, lng } : null;
}

@ApiTags("matches")
@Controller("matches")
@UseGuards(SessionAuthGuard)
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  @Get()
  async list(
    @CurrentUserId() userId: string,
    @Query(new ZodValidationPipe(matchQuerySchema)) query: ReturnType<typeof matchQuerySchema.parse>,
  ) {
    const all = await this.matches.computeAllForUser(userId, toLocation(query.lat, query.lng));
    const filtered = query.minScore !== undefined ? all.filter((m) => m.score >= query.minScore!) : all;

    const offset = query.cursor ? Number(Buffer.from(query.cursor, "base64url").toString("utf8")) || 0 : 0;
    const page = filtered.slice(offset, offset + query.limit);
    const nextCursor =
      offset + query.limit < filtered.length
        ? Buffer.from(String(offset + query.limit), "utf8").toString("base64url")
        : null;

    return { items: page, nextCursor };
  }

  @Post("recalculate")
  async recalculate(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(recalculateMatchesRequestSchema))
    body: ReturnType<typeof recalculateMatchesRequestSchema.parse>,
  ) {
    const results = await this.matches.computeAllForUser(userId, toLocation(body.lat, body.lng));
    return { recalculated: results.length, items: results };
  }

  @Get(":propertyId")
  async getForProperty(
    @CurrentUserId() userId: string,
    @Param("propertyId") propertyId: string,
    @Query(new ZodValidationPipe(matchQuerySchema)) query: ReturnType<typeof matchQuerySchema.parse>,
  ) {
    const result = await this.matches.computeForProperty(userId, propertyId, toLocation(query.lat, query.lng));
    if (!result) {
      throw new NotFoundException({ code: "PROPERTY_NOT_FOUND", message: "Imóvel não encontrado" });
    }
    return result;
  }
}
