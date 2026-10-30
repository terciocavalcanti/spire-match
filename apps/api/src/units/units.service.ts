import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminUnitListQuery,
  CreateUnitRequest,
  ImportUnitsResponse,
  Unit,
  UpdateUnitRequest,
} from "@spire/contracts";
import { createUnitRequestSchema } from "@spire/contracts";
import { and, eq, ilike, or } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { developmentBlocks, developments, unitPriceHistory, units } from "../database/schema";

import { toUnit } from "./unit-mapper";

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

@Injectable()
export class UnitsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private async toUnitWithNames(row: typeof units.$inferSelect): Promise<Unit> {
    const [development] = await this.db.select({ name: developments.name }).from(developments).where(eq(developments.id, row.developmentId)).limit(1);
    const block = row.blockId
      ? (await this.db.select({ name: developmentBlocks.name }).from(developmentBlocks).where(eq(developmentBlocks.id, row.blockId)).limit(1))[0]
      : undefined;
    return toUnit(row, development?.name ?? "—", block?.name ?? null);
  }

  async list(query: AdminUnitListQuery): Promise<{ items: Unit[]; nextCursor: string | null }> {
    const offset = decodeCursor(query.cursor);
    const conditions = [];
    if (query.developmentId) conditions.push(eq(units.developmentId, query.developmentId));
    if (query.status) conditions.push(eq(units.status, query.status));
    if (query.q) conditions.push(or(ilike(units.identifier, `%${query.q}%`))!);

    const rows = await this.db
      .select({ unit: units, developmentName: developments.name, blockName: developmentBlocks.name })
      .from(units)
      .innerJoin(developments, eq(developments.id, units.developmentId))
      .leftJoin(developmentBlocks, eq(developmentBlocks.id, units.blockId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(units.createdAt)
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items: pageRows.map((r) => toUnit(r.unit, r.developmentName, r.blockName)),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async create(request: CreateUnitRequest): Promise<Unit> {
    const [development] = await this.db.select({ id: developments.id }).from(developments).where(eq(developments.id, request.developmentId)).limit(1);
    if (!development) throw new NotFoundException({ code: "DEVELOPMENT_NOT_FOUND", message: "Empreendimento não encontrado" });

    const [row] = await this.db
      .insert(units)
      .values({
        developmentId: request.developmentId,
        blockId: request.blockId ?? null,
        identifier: request.identifier,
        floor: request.floor ?? null,
        areaSqm: request.areaSqm.toFixed(2),
        bedrooms: request.bedrooms,
        parkingSpaces: request.parkingSpaces,
        price: request.price.toFixed(2),
        status: request.status,
        propertyId: request.propertyId ?? null,
      })
      .returning();
    if (!row) throw new Error("Falha ao criar unidade");

    await this.db.insert(unitPriceHistory).values({ unitId: row.id, price: row.price });
    return this.toUnitWithNames(row);
  }

  async update(id: string, request: UpdateUnitRequest): Promise<Unit> {
    const [current] = await this.db.select().from(units).where(eq(units.id, id)).limit(1);
    if (!current) throw new NotFoundException({ code: "UNIT_NOT_FOUND", message: "Unidade não encontrada" });

    const [row] = await this.db
      .update(units)
      .set({
        ...(request.blockId !== undefined && { blockId: request.blockId }),
        ...(request.identifier !== undefined && { identifier: request.identifier }),
        ...(request.floor !== undefined && { floor: request.floor }),
        ...(request.areaSqm !== undefined && { areaSqm: request.areaSqm.toFixed(2) }),
        ...(request.bedrooms !== undefined && { bedrooms: request.bedrooms }),
        ...(request.parkingSpaces !== undefined && { parkingSpaces: request.parkingSpaces }),
        ...(request.price !== undefined && { price: request.price.toFixed(2) }),
        ...(request.status !== undefined && { status: request.status }),
        ...(request.propertyId !== undefined && { propertyId: request.propertyId }),
        updatedAt: new Date(),
      })
      .where(eq(units.id, id))
      .returning();
    if (!row) throw new Error("Falha ao atualizar unidade");

    if (request.price !== undefined && request.price.toFixed(2) !== current.price) {
      await this.db.insert(unitPriceHistory).values({ unitId: id, price: row.price });
    }

    return this.toUnitWithNames(row);
  }

  /** Cada linha é validada individualmente — linhas inválidas não derrubam o lote inteiro (ver contrato). */
  async importRows(developmentId: string, rawRows: Record<string, unknown>[]): Promise<ImportUnitsResponse> {
    const [development] = await this.db.select({ id: developments.id }).from(developments).where(eq(developments.id, developmentId)).limit(1);
    if (!development) throw new NotFoundException({ code: "DEVELOPMENT_NOT_FOUND", message: "Empreendimento não encontrado" });

    const rowSchema = createUnitRequestSchema.omit({ developmentId: true });
    const errors: { row: number; message: string }[] = [];
    let imported = 0;

    for (let i = 0; i < rawRows.length; i += 1) {
      const parsed = rowSchema.safeParse(rawRows[i]);
      if (!parsed.success) {
        errors.push({ row: i + 1, message: parsed.error.issues.map((iss) => iss.message).join("; ") });
        continue;
      }
      await this.create({ ...parsed.data, developmentId });
      imported += 1;
    }

    return { imported, errors };
  }
}
