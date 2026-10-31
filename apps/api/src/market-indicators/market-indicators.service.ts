import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateMarketIndicatorRequest, MarketIndicator, UpdateMarketIndicatorRequest } from "@spire/contracts";
import { desc, eq } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { marketIndicators } from "../database/schema";

function toMarketIndicator(row: typeof marketIndicators.$inferSelect): MarketIndicator {
  return {
    id: row.id,
    title: row.title,
    value: Number(row.value),
    unit: row.unit,
    region: row.region,
    period: row.period,
    source: row.source,
    methodology: row.methodology,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class MarketIndicatorsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(): Promise<MarketIndicator[]> {
    const rows = await this.db.select().from(marketIndicators).orderBy(desc(marketIndicators.createdAt));
    return rows.map(toMarketIndicator);
  }

  /** Usado pelo Pulse (app do comprador) — só indicadores ativos, nunca um rascunho. */
  async listActive(): Promise<MarketIndicator[]> {
    const rows = await this.db.select().from(marketIndicators).where(eq(marketIndicators.active, true)).orderBy(desc(marketIndicators.createdAt));
    return rows.map(toMarketIndicator);
  }

  async create(request: CreateMarketIndicatorRequest): Promise<MarketIndicator> {
    const [row] = await this.db
      .insert(marketIndicators)
      .values({ ...request, value: request.value.toString() })
      .returning();
    if (!row) throw new Error("Falha ao criar indicador");
    return toMarketIndicator(row);
  }

  async update(id: string, request: UpdateMarketIndicatorRequest): Promise<MarketIndicator> {
    const [existing] = await this.db.select().from(marketIndicators).where(eq(marketIndicators.id, id)).limit(1);
    if (!existing) throw new NotFoundException({ code: "MARKET_INDICATOR_NOT_FOUND", message: "Indicador não encontrado" });

    const [row] = await this.db
      .update(marketIndicators)
      .set({
        ...(request.title !== undefined ? { title: request.title } : {}),
        ...(request.value !== undefined ? { value: request.value.toString() } : {}),
        ...(request.unit !== undefined ? { unit: request.unit } : {}),
        ...(request.region !== undefined ? { region: request.region } : {}),
        ...(request.period !== undefined ? { period: request.period } : {}),
        ...(request.source !== undefined ? { source: request.source } : {}),
        ...(request.methodology !== undefined ? { methodology: request.methodology } : {}),
        ...(request.active !== undefined ? { active: request.active } : {}),
        updatedAt: new Date(),
      })
      .where(eq(marketIndicators.id, id))
      .returning();
    return toMarketIndicator(row!);
  }

  async delete(id: string): Promise<void> {
    const [existing] = await this.db.select().from(marketIndicators).where(eq(marketIndicators.id, id)).limit(1);
    if (!existing) throw new NotFoundException({ code: "MARKET_INDICATOR_NOT_FOUND", message: "Indicador não encontrado" });
    await this.db.delete(marketIndicators).where(eq(marketIndicators.id, id));
  }
}
