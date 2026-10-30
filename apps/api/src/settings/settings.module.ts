import { Global, Module } from "@nestjs/common";

import { SettingsService } from "./settings.service";

// Global: SettingsService é consumido por vários módulos (Leads/Commissions
// no D3, Matches/Radars no D5) sem precisar importar SettingsModule em cada um.
@Global()
@Module({
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
