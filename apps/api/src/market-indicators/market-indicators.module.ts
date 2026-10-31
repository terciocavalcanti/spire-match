import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { MarketIndicatorsController } from "./market-indicators.controller";
import { MarketIndicatorsService } from "./market-indicators.service";

@Module({
  imports: [AuthModule],
  controllers: [MarketIndicatorsController],
  providers: [MarketIndicatorsService],
})
export class MarketIndicatorsModule {}
