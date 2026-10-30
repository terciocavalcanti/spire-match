import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { DevelopmentsController } from "./developments.controller";
import { DevelopmentsService } from "./developments.service";

@Module({
  imports: [AuthModule],
  controllers: [DevelopmentsController],
  providers: [DevelopmentsService],
  exports: [DevelopmentsService],
})
export class DevelopmentsModule {}
