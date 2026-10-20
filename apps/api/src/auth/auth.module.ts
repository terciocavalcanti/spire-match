import { Module } from "@nestjs/common";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SessionAuthGuard } from "./guards/session-auth.guard";
import { PasswordService } from "./password.service";
import { SessionService } from "./session.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, PasswordService, SessionService, SessionAuthGuard],
  exports: [SessionService, SessionAuthGuard],
})
export class AuthModule {}
