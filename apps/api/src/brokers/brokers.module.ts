import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { BrokersController } from "./brokers.controller";
import { BrokersService } from "./brokers.service";

@Module({
  imports: [AuthModule],
  controllers: [BrokersController],
  providers: [BrokersService],
  exports: [BrokersService],
})
export class BrokersModule {}
