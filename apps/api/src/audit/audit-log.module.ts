import { Global, Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";

import { AuditLogController } from "./audit-log.controller";
import { AuditLogService } from "./audit-log.service";

// Global: AuditLogService é chamado a partir de vários serviços (D1, D3/leads,
// E1/E2, E4, D5/settings) sem precisar importar AuditLogModule em cada um —
// mesmo padrão de SettingsModule.
@Global()
@Module({
  imports: [AuthModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
