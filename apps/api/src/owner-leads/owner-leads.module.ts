import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PrivateMarketModule } from "../private-market/private-market.module";
import { PropertiesModule } from "../properties/properties.module";

import { OwnerLeadsController } from "./owner-leads.controller";
import { OwnerLeadsService } from "./owner-leads.service";

@Module({
  imports: [AuthModule, PropertiesModule, PrivateMarketModule],
  controllers: [OwnerLeadsController],
  providers: [OwnerLeadsService],
  exports: [OwnerLeadsService],
})
export class OwnerLeadsModule {}
