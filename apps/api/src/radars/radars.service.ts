import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { CreateRadarRequest, Radar } from "@spire/contracts";
import { and, desc, eq, gte, inArray, lte, notInArray } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { properties, radarSeenProperties, radars } from "../database/schema";
import { NotificationsService } from "../notifications/notifications.service";
import { SettingsService } from "../settings/settings.service";

import { toRadar } from "./radar-mapper";

@Injectable()
export class RadarsService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly notifications: NotificationsService,
    private readonly settings: SettingsService,
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
   * Checagem sob demanda, com verificação de dono: compara o critério salvo
   * contra o catálogo atual e notifica só os imóveis ainda não vistos por
   * este radar. Disparada ao criar o radar e pelo botão "Verificar agora".
   */
  async check(userId: string, radarId: string): Promise<{ newMatches: number }> {
    const [radar] = await this.db.select().from(radars).where(and(eq(radars.id, radarId), eq(radars.userId, userId))).limit(1);
    if (!radar) throw new NotFoundException({ code: "RADAR_NOT_FOUND", message: "Radar não encontrado" });
    return this.performCheck(radar);
  }

  /**
   * Varre todos os radares ativos — chamada pelo job `radar-sweep` do
   * apps/worker, que faz ping a cada `RADAR_SWEEP_INTERVAL_MINUTES` (padrão
   * do worker, fixo). O intervalo *efetivo* é controlado aqui, por
   * `platform_settings` (D5): um ping que chega antes do intervalo
   * configurado é ignorado. Isso permite aumentar o intervalo pelo admin
   * sem reiniciar o worker — nunca diminuir abaixo do ping fixo do worker,
   * o que é documentado na tela de Configurações.
   */
  async sweep(): Promise<{ radarsChecked: number; newMatchesTotal: number }> {
    const [intervalMinutes, lastRunAt] = await Promise.all([
      this.settings.getRadarSweepIntervalMinutes(),
      this.settings.getRadarSweepLastRunAt(),
    ]);
    if (lastRunAt && Date.now() - lastRunAt.getTime() < intervalMinutes * 60_000) {
      return { radarsChecked: 0, newMatchesTotal: 0 };
    }

    const activeRadars = await this.db.select().from(radars).where(eq(radars.active, true));
    let newMatchesTotal = 0;
    for (const radar of activeRadars) {
      const { newMatches } = await this.performCheck(radar);
      newMatchesTotal += newMatches;
    }
    await this.settings.setRadarSweepLastRunAt(new Date());
    return { radarsChecked: activeRadars.length, newMatchesTotal };
  }

  private async performCheck(radar: typeof radars.$inferSelect): Promise<{ newMatches: number }> {
    const radarId = radar.id;
    const userId = radar.userId;

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
