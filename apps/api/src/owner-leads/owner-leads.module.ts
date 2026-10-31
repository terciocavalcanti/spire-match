import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { PropertiesModule } from "../properties/properties.module";

import { OwnerLeadsController } from "./owner-leads.controller";
import { OwnerLeadsService } from "./owner-leads.service";

@Module({
  imports: [AuthModule, PropertiesModule],
  controllers: [OwnerLeadsController],
  providers: [OwnerLeadsService],
  exports: [OwnerLeadsService],
})
export class OwnerLeadsModule {}
