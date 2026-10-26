import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { MatchesModule } from "../matches/matches.module";

import { ToursController } from "./tours.controller";
import { ToursService } from "./tours.service";

@Module({
  imports: [AuthModule, MatchesModule],
  controllers: [ToursController],
  providers: [ToursService],
})
export class ToursModule {}
