import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { IntegrationsStatusController } from "./integrations-status.controller";
import { IntegrationsStatusService } from "./integrations-status.service";

@Module({
  imports: [AuthModule],
  controllers: [IntegrationsStatusController],
  providers: [IntegrationsStatusService],
})
export class IntegrationsStatusModule {}
