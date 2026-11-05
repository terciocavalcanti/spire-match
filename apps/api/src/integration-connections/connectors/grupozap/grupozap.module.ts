import { Module } from "@nestjs/common";

import { AuthModule } from "../../../auth/auth.module";
import { LeadsModule } from "../../../leads/leads.module";
import { IntegrationConnectionsModule } from "../../integration-connections.module";

import { GrupoZapLeadsController } from "./grupozap-leads.controller";
import { GrupoZapLeadsService } from "./grupozap-leads.service";
import { GrupoZapWebhookAuthGuard } from "./grupozap-webhook-auth.guard";

@Module({
  imports: [IntegrationConnectionsModule, LeadsModule, AuthModule],
  controllers: [GrupoZapLeadsController],
  providers: [GrupoZapLeadsService, GrupoZapWebhookAuthGuard],
  exports: [GrupoZapLeadsService],
})
export class GrupoZapModule {}
