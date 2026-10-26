import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LeadsModule } from "../leads/leads.module";
import { NotificationsModule } from "../notifications/notifications.module";

import { ProposalsController } from "./proposals.controller";
import { ProposalsService } from "./proposals.service";

@Module({
  imports: [AuthModule, NotificationsModule, LeadsModule],
  controllers: [ProposalsController],
  providers: [ProposalsService],
})
export class ProposalsModule {}
