import { Module } from "@nestjs/common";

import { AutomationsModule } from "../automations/automations.module";
import { MatchesModule } from "../matches/matches.module";
import { RadarsModule } from "../radars/radars.module";

import { InternalController } from "./internal.controller";

@Module({
  imports: [MatchesModule, RadarsModule, AutomationsModule],
  controllers: [InternalController],
})
export class InternalModule {}
