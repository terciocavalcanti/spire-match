import { Module } from "@nestjs/common";

import { MatchesModule } from "../matches/matches.module";
import { RadarsModule } from "../radars/radars.module";

import { InternalController } from "./internal.controller";

@Module({
  imports: [MatchesModule, RadarsModule],
  controllers: [InternalController],
})
export class InternalModule {}
