import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { CommissionsModule } from "../commissions/commissions.module";

import { ReportsController } from "./reports.controller";
import { ReportsService } from "./reports.service";

@Module({
  imports: [AuthModule, CommissionsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
