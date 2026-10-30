import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { commissionListQuerySchema, markCommissionReceivedRequestSchema, reportsQuerySchema } from "@spire/contracts";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { CommissionsService } from "./commissions.service";

const FINANCE_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("commissions")
@Controller("commissions")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...FINANCE_ROLES)
export class CommissionsController {
  constructor(private readonly commissions: CommissionsService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(commissionListQuerySchema)) query: ReturnType<typeof commissionListQuerySchema.parse>) {
    return this.commissions.list(query);
  }

  @Get("summary")
  async summary(@Query(new ZodValidationPipe(reportsQuerySchema)) query: ReturnType<typeof reportsQuerySchema.parse>) {
    return this.commissions.summary(query.days);
  }

  @Post(":id/mark-received")
  async markReceived(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(markCommissionReceivedRequestSchema)) body: ReturnType<typeof markCommissionReceivedRequestSchema.parse>,
  ) {
    return this.commissions.markReceived(id, body);
  }
}
