import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { NotificationsModule } from "../notifications/notifications.module";

import { RadarsController } from "./radars.controller";
import { RadarsService } from "./radars.service";

@Module({
  imports: [AuthModule, NotificationsModule],
  controllers: [RadarsController],
  providers: [RadarsService],
})
export class RadarsModule {}
