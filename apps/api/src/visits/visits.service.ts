import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AdminVisitListQuery, CreateVisitRequest, Visit, VisitSlot } from "@spire/contracts";
import { and, asc, eq, gte, lt, lte, ne } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { brokers, properties, users, visits } from "../database/schema";
import { LeadsService } from "../leads/leads.service";
import { NotificationsService } from "../notifications/notifications.service";

import { toVisit } from "./visit-mapper";

const WORKING_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
// Brasil não observa horário de verão desde 2019 — offset fixo é correto o ano todo.
const RECIFE_UTC_OFFSET = "-03:00";

function pgErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  if ("code" in error && typeof (error as { code: unknown }).code === "string") {
    return (error as { code: string }).code;
  }
  // drizzle-orm encapsula o erro real do driver `postgres` em `.cause` —
  // o `code` do Postgres (ex.: 23505) não fica no nível superior do erro.
  if ("cause" in error) return pgErrorCode((error as { cause: unknown }).cause);
  return undefined;
}

function isUniqueViolation(error: unknown): boolean {
  return pgErrorCode(error) === "23505";
}

@Injectable()
export class VisitsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly notifications: NotificationsService,
    private readonly leads: LeadsService,
  ) {}

  async getAvailability(brokerId: string, date: string): Promise<VisitSlot[]> {
    const [broker] = await this.db.select({ id: brokers.id }).from(brokers).where(eq(brokers.id, brokerId)).limit(1);
    if (!broker) throw new NotFoundException({ code: "BROKER_NOT_FOUND", message: "Corretor não encontrado" });

    const dayStart = new Date(`${date}T00:00:00${RECIFE_UTC_OFFSET}`);
    const dayEnd = new Date(`${date}T23:59:59${RECIFE_UTC_OFFSET}`);

    const booked = await this.db
      .select({ scheduledAt: visits.scheduledAt })
      .from(visits)
      .where(
        and(
          eq(visits.brokerId, brokerId),
          ne(visits.status, "CANCELLED"),
          gte(visits.scheduledAt, dayStart),
          lt(visits.scheduledAt, dayEnd),
        ),
      );
    // Hora local de Recife (UTC-3) a partir do instante absoluto armazenado:
    // (horaUTC - 3 + 24) % 24, escrito como +21 para nunca ficar negativo.
    const bookedHours = new Set(booked.map((b) => (b.scheduledAt.getUTCHours() + 21) % 24));

    const now = new Date();
    return WORKING_HOURS.map((hour) => {
      const slotTime = new Date(`${date}T${String(hour).padStart(2, "0")}:00:00${RECIFE_UTC_OFFSET}`);
      const isPast = slotTime.getTime() <= now.getTime();
      return {
        time: `${String(hour).padStart(2, "0")}:00`,
        available: !bookedHours.has(hour) && !isPast,
      };
    });
  }

  async schedule(userId: string, request: CreateVisitRequest): Promise<Visit> {
    const scheduledAt = new Date(request.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() <= Date.now()) {
      throw new ConflictException({ code: "INVALID_SCHEDULE", message: "Horário precisa ser no futuro" });
    }

    const [property] = await this.db.select().from(properties).where(eq(properties.id, request.propertyId)).limit(1);
    if (!property) throw new NotFoundException({ code: "PROPERTY_NOT_FOUND", message: "Imóvel não encontrado" });

    const [broker] = await this.db.select().from(brokers).where(eq(brokers.id, request.brokerId)).limit(1);
    if (!broker) throw new NotFoundException({ code: "BROKER_NOT_FOUND", message: "Corretor não encontrado" });

    let row;
    try {
      [row] = await this.db
        .insert(visits)
        .values({
          userId,
          propertyId: request.propertyId,
          brokerId: request.brokerId,
          scheduledAt,
          notes: request.notes ?? null,
        })
        .returning();
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException({ code: "SLOT_ALREADY_BOOKED", message: "Este horário já foi reservado — escolha outro." });
      }
      throw error;
    }
    if (!row) throw new Error("Falha ao agendar visita");

    const when = scheduledAt.toLocaleString("pt-BR", { timeZone: "America/Recife", dateStyle: "short", timeStyle: "short" });
    await this.notifications.notify(
      userId,
      "VISIT_CONFIRMED",
      "Visita confirmada",
      `Sua visita a ${property.title} com ${broker.name} foi confirmada para ${when}.`,
      `/minhas-visitas`,
    );

    await this.leads.recordSignal(
      userId,
      "VISIT_SCHEDULED",
      `Visita agendada a ${property.title} com ${broker.name} para ${when}.`,
      property.id,
    );

    return toVisit(row, property, broker);
  }

  async listMine(userId: string): Promise<Visit[]> {
    const rows = await this.db
      .select({ visit: visits, property: properties, broker: brokers })
      .from(visits)
      .innerJoin(properties, eq(properties.id, visits.propertyId))
      .innerJoin(brokers, eq(brokers.id, visits.brokerId))
      .where(eq(visits.userId, userId))
      .orderBy(asc(visits.scheduledAt));

    return rows.map(({ visit, property, broker }) => toVisit(visit, property, broker));
  }

  async cancel(userId: string, visitId: string): Promise<void> {
    const [row] = await this.db
      .update(visits)
      .set({ status: "CANCELLED", updatedAt: new Date() })
      .where(and(eq(visits.id, visitId), eq(visits.userId, userId)))
      .returning({ id: visits.id, propertyId: visits.propertyId });
    if (!row) throw new NotFoundException({ code: "VISIT_NOT_FOUND", message: "Visita não encontrada" });

    const [property] = await this.db.select({ title: properties.title }).from(properties).where(eq(properties.id, row.propertyId)).limit(1);
    await this.leads.recordSignal(userId, "VISIT_CANCELLED", `Visita a ${property?.title ?? "imóvel"} cancelada.`);
  }

  /** Agenda administrativa: todas as visitas (não só as do usuário logado). */
  async listAll(query: AdminVisitListQuery): Promise<Visit[]> {
    const conditions = [];
    if (query.brokerId) conditions.push(eq(visits.brokerId, query.brokerId));
    if (query.from) conditions.push(gte(visits.scheduledAt, new Date(`${query.from}T00:00:00${RECIFE_UTC_OFFSET}`)));
    if (query.to) conditions.push(lte(visits.scheduledAt, new Date(`${query.to}T23:59:59${RECIFE_UTC_OFFSET}`)));

    const rows = await this.db
      .select({ visit: visits, property: properties, broker: brokers, buyer: users })
      .from(visits)
      .innerJoin(properties, eq(properties.id, visits.propertyId))
      .innerJoin(brokers, eq(brokers.id, visits.brokerId))
      .innerJoin(users, eq(users.id, visits.userId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(visits.scheduledAt));

    return rows.map(({ visit, property, broker, buyer }) => toVisit(visit, property, broker, buyer));
  }
}
