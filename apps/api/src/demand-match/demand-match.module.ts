import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { DemandMatchController } from "./demand-match.controller";
import { DemandMatchService } from "./demand-match.service";

@Module({
  imports: [AuthModule],
  controllers: [DemandMatchController],
  providers: [DemandMatchService],
})
export class DemandMatchModule {}
