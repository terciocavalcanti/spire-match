import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { IntegrationEvent, IntegrationEventDirection, IntegrationEventListQuery } from "@spire/contracts";
import { and, desc, eq, lt, sql } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { integrationConnections, integrationEvents } from "../database/schema";

import { IntegrationConnectionsService } from "./integration-connections.service";

// Mesmo padrão de VisitsService (reserva atômica de horário): o índice único
// parcial é a garantia real sob concorrência, não um SELECT-antes-de-INSERT
// em memória. O `code` do Postgres fica em `.cause` por trás do driver `postgres`.
function pgErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof (error as { code: unknown }).code === "string") {
    return (error as { code: string }).code;
  }
  if ("cause" in error) return pgErrorCode((error as { cause: unknown }).cause);
  return undefined;
}
function isUniqueViolation(error: unknown): boolean {
  return pgErrorCode(error) === "23505";
}

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}
function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

function toEvent(row: typeof integrationEvents.$inferSelect): IntegrationEvent {
  return {
    id: row.id,
    connectionId: row.connectionId,
    direction: row.direction,
    eventType: row.eventType,
    externalEventId: row.externalEventId,
    entityType: row.entityType,
    internalId: row.internalId,
    payload: row.payload as Record<string, unknown>,
    status: row.status,
    attempts: row.attempts,
    errorMessage: row.errorMessage,
    receivedAt: row.receivedAt.toISOString(),
    processedAt: row.processedAt?.toISOString() ?? null,
  };
}

export interface IngestEventParams {
  connectionId: string;
  direction: IntegrationEventDirection;
  eventType: string;
  payload: Record<string, unknown>;
  externalEventId?: string | null;
  entityType?: string | null;
  internalId?: string | null;
}

const MAX_RETRY_ATTEMPTS = 5;

/**
 * Histórico de eventos de integração (M1): persiste, deduplica sob
 * concorrência real e permite reprocessar falhas. Não decide o que um
 * evento PROCESSADO faz de fato (criar lead, atualizar anúncio...) — isso
 * é responsabilidade do conector concreto que vier a existir em M2+; esta
 * fundação só garante que nenhum evento recebido se perde ou duplica.
 */
@Injectable()
export class IntegrationEventsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly connections: IntegrationConnectionsService,
  ) {}

  async ingest(params: IngestEventParams): Promise<{ event: IntegrationEvent; duplicate: boolean }> {
    try {
      const [row] = await this.db
        .insert(integrationEvents)
        .values({
          connectionId: params.connectionId,
          direction: params.direction,
          eventType: params.eventType,
          payload: params.payload,
          externalEventId: params.externalEventId ?? null,
          entityType: params.entityType ?? null,
          internalId: params.internalId ?? null,
        })
        .returning();
      return { event: toEvent(row!), duplicate: false };
    } catch (error) {
      if (!isUniqueViolation(error) || !params.externalEventId) throw error;

      // Perdeu a corrida de dedupe: o evento já existe (índice único parcial
      // por connectionId+externalEventId) — devolve o existente como
      // duplicado em vez de inserir de novo ou falhar a requisição.
      const [existing] = await this.db
        .select()
        .from(integrationEvents)
        .where(and(eq(integrationEvents.connectionId, params.connectionId), eq(integrationEvents.externalEventId, params.externalEventId)))
        .limit(1);
      if (!existing) throw error;
      return { event: toEvent(existing), duplicate: true };
    }
  }

  async markProcessed(eventId: string): Promise<void> {
    await this.db.update(integrationEvents).set({ status: "PROCESSADO", processedAt: new Date() }).where(eq(integrationEvents.id, eventId));
  }

  async markFailed(eventId: string, errorMessage: string): Promise<void> {
    const [row] = await this.db
      .update(integrationEvents)
      .set({ status: "FALHOU", errorMessage: errorMessage.slice(0, 500), attempts: sql`${integrationEvents.attempts} + 1`, processedAt: null })
      .where(eq(integrationEvents.id, eventId))
      .returning({ connectionId: integrationEvents.connectionId });
    if (row) await this.connections.recordError(row.connectionId, errorMessage);
  }

  async list(connectionId: string, query: IntegrationEventListQuery): Promise<{ items: IntegrationEvent[]; nextCursor: string | null }> {
    const [connection] = await this.db.select({ id: integrationConnections.id }).from(integrationConnections).where(eq(integrationConnections.id, connectionId)).limit(1);
    if (!connection) throw new NotFoundException({ code: "INTEGRATION_CONNECTION_NOT_FOUND", message: "Conexão não encontrada" });

    const offset = decodeCursor(query.cursor);
    const conditions = [eq(integrationEvents.connectionId, connectionId)];
    if (query.status) conditions.push(eq(integrationEvents.status, query.status));

    const rows = await this.db
      .select()
      .from(integrationEvents)
      .where(and(...conditions))
      .orderBy(desc(integrationEvents.receivedAt))
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;
    return { items: pageRows.map(toEvent), nextCursor: hasMore ? encodeCursor(offset + query.limit) : null };
  }

  /**
   * Requeue de eventos FALHOU de volta para PENDENTE, respeitando um teto de
   * tentativas — chamado pelo worker (ver apps/worker/src/jobs/integration-events-retry.ts).
   * Eventos que já esgotaram o teto ficam FALHOU para sempre (visíveis no
   * monitoramento de falhas), nunca reentram num loop infinito.
   */
  async requeueFailed(): Promise<number> {
    // Um único UPDATE guardado por `attempts < teto` no WHERE — evento que já
    // esgotou o teto nunca é tocado (fica FALHOU, visível no monitoramento),
    // em vez de buscar tudo e filtrar depois em memória.
    const rows = await this.db
      .update(integrationEvents)
      .set({ status: "PENDENTE", attempts: sql`${integrationEvents.attempts} + 1` })
      .where(and(eq(integrationEvents.status, "FALHOU"), lt(integrationEvents.attempts, MAX_RETRY_ATTEMPTS)))
      .returning({ id: integrationEvents.id });
    return rows.length;
  }
}
