import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { demandMatchQuerySchema } from "@spire/contracts";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { DemandMatchService } from "./demand-match.service";

const CRM_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("demand-match")
@Controller("demand-match")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...CRM_ROLES)
export class DemandMatchController {
  constructor(private readonly demandMatch: DemandMatchService) {}

  @Get()
  async get(@Query(new ZodValidationPipe(demandMatchQuerySchema)) query: ReturnType<typeof demandMatchQuerySchema.parse>) {
    return this.demandMatch.compute(query);
  }
}
