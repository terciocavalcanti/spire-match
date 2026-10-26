import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateRadarRequest, Radar } from "@spire/contracts";
import { and, desc, eq, gte, inArray, lte, notInArray } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { properties, radarSeenProperties, radars } from "../database/schema";
import { NotificationsService } from "../notifications/notifications.service";

import { toRadar } from "./radar-mapper";

@Injectable()
export class RadarsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly notifications: NotificationsService,
  ) {}

  private async matchesCount(radarId: string): Promise<number> {
    const rows = await this.db
      .select({ id: radarSeenProperties.id })
      .from(radarSeenProperties)
      .where(eq(radarSeenProperties.radarId, radarId));
    return rows.length;
  }

  async create(userId: string, request: CreateRadarRequest): Promise<Radar> {
    const [row] = await this.db
      .insert(radars)
      .values({ userId, name: request.name, criteria: request.criteria })
      .returning();
    if (!row) throw new Error("Falha ao criar radar");

    // Checagem imediata ao criar — o comprador vê na hora se já existem
    // imóveis compatíveis, sem precisar esperar uma checagem futura.
    await this.check(userId, row.id);
    const refreshed = await this.getOwned(userId, row.id);
    return refreshed;
  }

  async listMine(userId: string): Promise<Radar[]> {
    const rows = await this.db.select().from(radars).where(eq(radars.userId, userId)).orderBy(desc(radars.createdAt));
    return Promise.all(rows.map(async (row) => toRadar(row, await this.matchesCount(row.id))));
  }

  async getOwned(userId: string, radarId: string): Promise<Radar> {
    const [row] = await this.db.select().from(radars).where(and(eq(radars.id, radarId), eq(radars.userId, userId))).limit(1);
    if (!row) throw new NotFoundException({ code: "RADAR_NOT_FOUND", message: "Radar não encontrado" });
    return toRadar(row, await this.matchesCount(row.id));
  }

  async remove(userId: string, radarId: string): Promise<void> {
    const [row] = await this.db
      .delete(radars)
      .where(and(eq(radars.id, radarId), eq(radars.userId, userId)))
      .returning({ id: radars.id });
    if (!row) throw new NotFoundException({ code: "RADAR_NOT_FOUND", message: "Radar não encontrado" });
  }

  /**
   * Checagem sob demanda: compara o critério salvo contra o catálogo atual e
   * notifica só os imóveis ainda não vistos por este radar. Sem worker em
   * background (ver nota em `database/schema/radars.ts`) — disparada ao
   * criar o radar e pelo botão "Verificar agora" na tela.
   */
  async check(userId: string, radarId: string): Promise<{ newMatches: number }> {
    const [radar] = await this.db.select().from(radars).where(and(eq(radars.id, radarId), eq(radars.userId, userId))).limit(1);
    if (!radar) throw new NotFoundException({ code: "RADAR_NOT_FOUND", message: "Radar não encontrado" });

    const seen = await this.db
      .select({ propertyId: radarSeenProperties.propertyId })
      .from(radarSeenProperties)
      .where(eq(radarSeenProperties.radarId, radarId));
    const seenIds = seen.map((s) => s.propertyId);

    const conditions = [eq(properties.status, "AVAILABLE")];
    if (radar.criteria.type) conditions.push(eq(properties.type, radar.criteria.type));
    if (radar.criteria.purpose) conditions.push(eq(properties.purpose, radar.criteria.purpose));
    if (radar.criteria.priceMax !== undefined) conditions.push(lte(properties.price, radar.criteria.priceMax.toFixed(2)));
    if (radar.criteria.bedroomsMin !== undefined) conditions.push(gte(properties.bedrooms, radar.criteria.bedroomsMin));
    if (radar.criteria.neighborhoods.length > 0) conditions.push(inArray(properties.neighborhood, radar.criteria.neighborhoods));
    if (seenIds.length > 0) conditions.push(notInArray(properties.id, seenIds));

    const matches = await this.db
      .select({ id: properties.id, title: properties.title })
      .from(properties)
      .where(and(...conditions))
      .limit(50);

    if (matches.length > 0) {
      await this.db.insert(radarSeenProperties).values(matches.map((m) => ({ radarId, propertyId: m.id })));
      await this.notifications.notify(
        userId,
        "RADAR_HIT",
        `Radar "${radar.name}": ${matches.length} novo${matches.length > 1 ? "s" : ""} imóve${matches.length > 1 ? "is" : "l"}`,
        matches.length === 1
          ? `Encontramos "${matches[0]!.title}" compatível com o seu radar.`
          : `Encontramos ${matches.length} imóveis compatíveis com o seu radar.`,
        "/radares",
      );
    }

    await this.db.update(radars).set({ lastCheckedAt: new Date(), updatedAt: new Date() }).where(eq(radars.id, radarId));

    return { newMatches: matches.length };
  }
}
