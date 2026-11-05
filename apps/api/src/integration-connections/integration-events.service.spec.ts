import type { Database } from "../database/client";
import type { integrationEvents } from "../database/schema";

import { IntegrationConnectionsService } from "./integration-connections.service";
import { IntegrationEventsService } from "./integration-events.service";

type EventRow = typeof integrationEvents.$inferSelect;

function buildRow(overrides: Partial<EventRow> = {}): EventRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    connectionId: "22222222-2222-2222-2222-222222222222",
    direction: "ENTRADA",
    eventType: "LEAD_RECEIVED",
    externalEventId: "ext-123",
    entityType: null,
    internalId: null,
    payload: {},
    status: "PENDENTE",
    attempts: 0,
    errorMessage: null,
    receivedAt: new Date("2026-01-01T00:00:00Z"),
    processedAt: null,
    ...overrides,
  };
}

/** Simula o erro real que o driver `postgres` produz numa violação de unicidade (23505) — ver isUniqueViolation. */
function uniqueViolationError(): Error {
  return Object.assign(new Error("duplicate key value violates unique constraint"), { cause: { code: "23505" } });
}

/**
 * Dublê mínimo da interface fluente do Drizzle usada por `ingest` — só os
 * dois caminhos exercidos (`insert().values().returning()` e
 * `select().from().where().limit()`), sem banco real. Mantém este teste
 * determinístico e sem dependência de Postgres, consistente com o único
 * outro teste de unidade da API (`ZodValidationPipe`, também sem DB).
 */
function makeFakeDb(params: { insertedRow: EventRow; existingRow: EventRow; conflictOnInsert: boolean }): Database {
  return {
    insert: () => ({
      values: () => ({
        returning: async () => {
          if (params.conflictOnInsert) throw uniqueViolationError();
          return [params.insertedRow];
        },
      }),
    }),
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [params.existingRow],
        }),
      }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("IntegrationEventsService.ingest", () => {
  const fakeConnections = { recordError: jest.fn() } as unknown as IntegrationConnectionsService;

  it("cria um evento novo quando não há conflito de dedupe", async () => {
    const insertedRow = buildRow();
    const service = new IntegrationEventsService(makeFakeDb({ insertedRow, existingRow: insertedRow, conflictOnInsert: false }), fakeConnections);

    const result = await service.ingest({
      connectionId: insertedRow.connectionId,
      direction: "ENTRADA",
      eventType: "LEAD_RECEIVED",
      payload: {},
      externalEventId: insertedRow.externalEventId,
    });

    expect(result.duplicate).toBe(false);
    expect(result.event.id).toBe(insertedRow.id);
    expect(result.event.status).toBe("PENDENTE");
  });

  it("devolve o evento já existente como duplicado quando duas tentativas concorrentes usam o mesmo externalEventId", async () => {
    const existingRow = buildRow({ id: "existing-row-id" });
    const service = new IntegrationEventsService(
      makeFakeDb({ insertedRow: existingRow, existingRow, conflictOnInsert: true }),
      fakeConnections,
    );

    const result = await service.ingest({
      connectionId: existingRow.connectionId,
      direction: "ENTRADA",
      eventType: "LEAD_RECEIVED",
      payload: {},
      externalEventId: existingRow.externalEventId,
    });

    expect(result.duplicate).toBe(true);
    expect(result.event.id).toBe(existingRow.id);
  });

  it("relança a violação de unicidade quando não há externalEventId (dedupe não se aplica)", async () => {
    const row = buildRow({ externalEventId: null });
    const service = new IntegrationEventsService(makeFakeDb({ insertedRow: row, existingRow: row, conflictOnInsert: true }), fakeConnections);

    await expect(
      service.ingest({
        connectionId: row.connectionId,
        direction: "ENTRADA",
        eventType: "LEAD_RECEIVED",
        payload: {},
      }),
    ).rejects.toThrow("duplicate key value violates unique constraint");
  });
});
