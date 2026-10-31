import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";

import { IntegrationsStatusService } from "./integrations-status.service";

@ApiTags("integrations-status")
@Controller("integrations-status")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles("ADMIN", "SUPER_ADMIN")
export class IntegrationsStatusController {
  constructor(private readonly integrationsStatus: IntegrationsStatusService) {}

  @Get()
  list() {
    return { items: this.integrationsStatus.list() };
  }
}
