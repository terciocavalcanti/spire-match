import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { DataSubjectRequestsController, MeDataRequestsController } from "./data-subject-requests.controller";
import { DataSubjectRequestsService } from "./data-subject-requests.service";

@Module({
  imports: [AuthModule],
  controllers: [MeDataRequestsController, DataSubjectRequestsController],
  providers: [DataSubjectRequestsService],
})
export class DataSubjectRequestsModule {}
