import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createIntegrationConnectionRequestSchema, integrationEventListQuerySchema, updateIntegrationConnectionRequestSchema } from "@spire/contracts";

import { AuditLogService } from "../audit/audit-log.service";
import { CurrentUserId } from "../auth/decorators/current-user-id.decorator";
import { SessionAuthGuard } from "../auth/guards/session-auth.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { RolesGuard } from "../common/guards/roles.guard";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

import { IntegrationConnectionsService } from "./integration-connections.service";
import { IntegrationEventsService } from "./integration-events.service";

// Mesmo nível de sensibilidade de Configurações/Automações — credenciais e
// histórico de eventos de integração não são dado de corretor comum.
const INTEGRATION_ROLES = ["ADMIN", "SUPER_ADMIN"] as const;

@ApiTags("integration-connections")
@Controller("integration-connections")
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles(...INTEGRATION_ROLES)
export class IntegrationConnectionsController {
  constructor(
    private readonly connections: IntegrationConnectionsService,
    private readonly events: IntegrationEventsService,
    private readonly auditLog: AuditLogService,
  ) {}

  @Get()
  async list() {
    return { items: await this.connections.list() };
  }

  @Post()
  async create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createIntegrationConnectionRequestSchema)) body: ReturnType<typeof createIntegrationConnectionRequestSchema.parse>,
  ) {
    const connection = await this.connections.create(body, userId);
    await this.auditLog.record({
      actorUserId: userId,
      action: "integration_connections.created",
      entityType: "integration_connection",
      entityId: connection.id,
      metadata: { provider: connection.provider, label: connection.label },
    });
    return connection;
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateIntegrationConnectionRequestSchema)) body: ReturnType<typeof updateIntegrationConnectionRequestSchema.parse>,
  ) {
    const connection = await this.connections.update(id, body, userId);
    await this.auditLog.record({ actorUserId: userId, action: "integration_connections.updated", entityType: "integration_connection", entityId: id });
    return connection;
  }

  @Post(":id/activate")
  async activate(@Param("id") id: string, @CurrentUserId() userId: string) {
    const connection = await this.connections.activate(id, userId);
    await this.auditLog.record({ actorUserId: userId, action: "integration_connections.activated", entityType: "integration_connection", entityId: id });
    return connection;
  }

  @Post(":id/pause")
  async pause(@Param("id") id: string, @CurrentUserId() userId: string) {
    const connection = await this.connections.pause(id, userId);
    await this.auditLog.record({ actorUserId: userId, action: "integration_connections.paused", entityType: "integration_connection", entityId: id });
    return connection;
  }

  @Get(":id/events")
  async listEvents(
    @Param("id") id: string,
    @Query(new ZodValidationPipe(integrationEventListQuerySchema)) query: ReturnType<typeof integrationEventListQuerySchema.parse>,
  ) {
    return this.events.list(id, query);
  }

  @Post("events/retry-failed")
  async retryFailed(@CurrentUserId() userId: string) {
    const requeued = await this.events.requeueFailed();
    await this.auditLog.record({ actorUserId: userId, action: "integration_connections.events_retried", entityType: "integration_event", metadata: { requeued } });
    return { requeued };
  }
}
