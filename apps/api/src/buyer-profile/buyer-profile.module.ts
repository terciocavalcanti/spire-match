import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { BuyerProfileController } from "./buyer-profile.controller";
import { BuyerProfileService } from "./buyer-profile.service";

@Module({
  imports: [AuthModule],
  controllers: [BuyerProfileController],
  providers: [BuyerProfileService],
  exports: [BuyerProfileService],
})
export class BuyerProfileModule {}
