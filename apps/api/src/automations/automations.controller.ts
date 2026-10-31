import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { type AutomationType, automationTypeSchema, updateAutomationRuleRequestSchema } from "@spire/contracts";

import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { AutomationsService } from "./automations.service";

const FINANCE_ROLES = ["ADMIN", "SUPER_ADMIN", "SALES_MANAGER"] as const;

@ApiTags("automations")
@Controller("automations")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...FINANCE_ROLES)
export class AutomationsController {
  constructor(private readonly automations: AutomationsService) {}

  @Get()
  async list() {
    const items = await this.automations.list();
    return { items };
  }

  @Patch(":type")
  async update(
    @Param("type", new ZodValidationPipe(automationTypeSchema)) type: AutomationType,
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateAutomationRuleRequestSchema)) body: ReturnType<typeof updateAutomationRuleRequestSchema.parse>,
  ) {
    return this.automations.update(type, body, userId);
  }

  @Post(":type/run")
  async run(@Param("type", new ZodValidationPipe(automationTypeSchema)) type: AutomationType) {
    const affected = type === "LEAD_AUTO_ASSIGN" ? await this.automations.runLeadAutoAssign() : await this.automations.runSlaReminders();
    return { type, affected };
  }
}
