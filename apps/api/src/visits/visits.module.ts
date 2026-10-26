import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LeadsModule } from "../leads/leads.module";
import { NotificationsModule } from "../notifications/notifications.module";

import { VisitsController } from "./visits.controller";
import { VisitsService } from "./visits.service";

@Module({
  imports: [AuthModule, NotificationsModule, LeadsModule],
  controllers: [VisitsController],
  providers: [VisitsService],
})
export class VisitsModule {}
