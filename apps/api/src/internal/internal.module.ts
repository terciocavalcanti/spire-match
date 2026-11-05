import { Module } from "@nestjs/common";

import { AutomationsModule } from "../automations/automations.module";
import { GrupoZapModule } from "../integration-connections/connectors/grupozap/grupozap.module";
import { IntegrationConnectionsModule } from "../integration-connections/integration-connections.module";
import { MatchesModule } from "../matches/matches.module";
import { RadarsModule } from "../radars/radars.module";

import { InternalController } from "./internal.controller";

@Module({
  imports: [MatchesModule, RadarsModule, AutomationsModule, IntegrationConnectionsModule, GrupoZapModule],
  controllers: [InternalController],
})
export class InternalModule {}
