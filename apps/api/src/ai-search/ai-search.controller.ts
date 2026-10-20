import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { aiSearchRequestSchema } from "@spire/contracts";

import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { AiSearchService } from "./ai-search.service";

@ApiTags("ai")
@Controller("ai")
export class AiSearchController {
  constructor(private readonly aiSearch: AiSearchService) {}

  @Post("search")
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async search(
    @Body(new ZodValidationPipe(aiSearchRequestSchema)) body: ReturnType<typeof aiSearchRequestSchema.parse>,
  ) {
    return this.aiSearch.search(body.query);
  }
}
