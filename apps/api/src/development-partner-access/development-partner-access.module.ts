import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { DevelopmentPartnerAccessController } from "./development-partner-access.controller";
import { DevelopmentPartnerAccessService } from "./development-partner-access.service";

@Module({
  imports: [AuthModule],
  controllers: [DevelopmentPartnerAccessController],
  providers: [DevelopmentPartnerAccessService],
})
export class DevelopmentPartnerAccessModule {}
