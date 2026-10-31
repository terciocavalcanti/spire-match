import { Global, Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { MatchesModule } from "../matches/matches.module";

import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

// Global: SettingsService é consumido por vários módulos (Leads/Commissions
// no D3, Matches/Radars no D5) sem precisar importar SettingsModule em cada um.
@Global()
@Module({
  imports: [AuthModule, MatchesModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
