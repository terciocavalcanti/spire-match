import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { auditLogListQuerySchema } from "@spire/contracts";

import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { AuditLogService } from "./audit-log.service";

// Mesmo nível de sensibilidade de Configurações — restrito a ADMIN/SUPER_ADMIN.
const AUDIT_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

@ApiTags("audit-logs")
@Controller("audit-logs")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...AUDIT_ROLES)
export class AuditLogController {
  constructor(private readonly auditLog: AuditLogService) {}

  @Get()
  async list(@Query(new ZodValidationPipe(auditLogListQuerySchema)) query: ReturnType<typeof auditLogListQuerySchema.parse>) {
    return this.auditLog.list(query);
  }
}
