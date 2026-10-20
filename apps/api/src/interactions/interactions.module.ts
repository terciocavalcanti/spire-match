import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { InteractionsController } from "./interactions.controller";
import { InteractionsService } from "./interactions.service";

@Module({
  imports: [AuthModule],
  controllers: [InteractionsController],
  providers: [InteractionsService],
})
export class InteractionsModule {}
