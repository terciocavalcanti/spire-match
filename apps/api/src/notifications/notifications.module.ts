import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";
import { WebPushService } from "./web-push.service";

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, WebPushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
