import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LeadsModule } from "../leads/leads.module";

import { PrivateMarketController } from "./private-market.controller";
import { PrivateMarketService } from "./private-market.service";

@Module({
  imports: [AuthModule, LeadsModule],
  controllers: [PrivateMarketController],
  providers: [PrivateMarketService],
  exports: [PrivateMarketService],
})
export class PrivateMarketModule {}
