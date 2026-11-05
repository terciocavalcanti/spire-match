import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { IntegrationConnectionsController } from "./integration-connections.controller";
import { IntegrationConnectionsService } from "./integration-connections.service";
import { IntegrationEventsService } from "./integration-events.service";
import { IntegrationExternalRefsService } from "./integration-external-refs.service";

@Module({
  imports: [AuthModule],
  controllers: [IntegrationConnectionsController],
  providers: [IntegrationConnectionsService, IntegrationEventsService, IntegrationExternalRefsService],
  exports: [IntegrationConnectionsService, IntegrationEventsService, IntegrationExternalRefsService],
})
export class IntegrationConnectionsModule {}
