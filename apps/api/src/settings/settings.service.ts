import { Inject, Injectable } from "@nestjs/common";
import type { MatchWeightsInput } from "@spire/contracts";
import { DEFAULT_MATCH_RULESET_VERSION, DEFAULT_MATCH_WEIGHTS } from "@spire/domain";
import { eq } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { platformSettings } from "../database/schema";

// Fallbacks quando o admin ainda não configurou nada em D5 — documentados
// aqui, não escondidos em números mágicos espalhados pelo código.
export const DEFAULT_COMMISSION_RATE = 0.05;
export const DEFAULT_RADAR_SWEEP_INTERVAL_MINUTES = 15;
export const DEFAULT_DEMAND_MATCH_THRESHOLD = 5;
// 5 anos — prazo civil geral de prescrição (art. 206, CC) usado como
// referência neutra na ausência de uma política jurídica própria definida.
export const DEFAULT_DATA_RETENTION_DAYS = 1825;

@Injectable()
export class SettingsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async get<T>(key: string, fallback: T): Promise<T> {
    const [row] = await this.db.select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
    return row ? (row.value as T) : fallback;
  }

  private async getWithMeta<T>(key: string): Promise<{ value: T; updatedAt: Date } | null> {
    const [row] = await this.db.select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
    return row ? { value: row.value as T, updatedAt: row.updatedAt } : null;
  }

  async set(key: string, value: unknown, updatedByUserId?: string): Promise<void> {
    await this.db
      .insert(platformSettings)
      .values({ key, value, updatedByUserId: updatedByUserId ?? null })
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: { value, updatedAt: new Date(), updatedByUserId: updatedByUserId ?? null },
      });
  }

  async getCommissionRate(): Promise<number> {
    return this.get<number>("commissionDefaultRate", DEFAULT_COMMISSION_RATE);
  }

  async getRadarSweepIntervalMinutes(): Promise<number> {
    return this.get<number>("radarSweepIntervalMinutes", DEFAULT_RADAR_SWEEP_INTERVAL_MINUTES);
  }

  async getRadarSweepLastRunAt(): Promise<Date | null> {
    const iso = await this.get<string | null>("radarSweepLastRunAt", null);
    return iso ? new Date(iso) : null;
  }

  async setRadarSweepLastRunAt(at: Date): Promise<void> {
    await this.set("radarSweepLastRunAt", at.toISOString());
  }

  /** Limiar mínimo de compradores para o Demand Match revelar uma contagem — anti-identificação (seção 4.8). */
  async getDemandMatchThreshold(): Promise<number> {
    return this.get<number>("demandMatchThreshold", DEFAULT_DEMAND_MATCH_THRESHOLD);
  }

  /**
   * Prazo de retenção exibido em Privacidade (LGPD, Marco F) — hoje é só
   * informativo/configurável, sem purga automática correspondente (ver
   * relatório de lacunas do marco).
   */
  async getDataRetentionDays(): Promise<number> {
    return this.get<number>("dataRetentionDays", DEFAULT_DATA_RETENTION_DAYS);
  }

  /**
   * `rulesetVersion` muda sozinho quando os pesos são salvos (deriva do
   * `updatedAt` da própria configuração) — sem precisar de uma coluna de
   * versão separada para rastrear qual fórmula gerou cada match_results.
   */
  async getMatchWeights(): Promise<{ weights: MatchWeightsInput; rulesetVersion: string; isDefault: boolean }> {
    const stored = await this.getWithMeta<MatchWeightsInput>("matchWeights");
    if (!stored) return { weights: DEFAULT_MATCH_WEIGHTS, rulesetVersion: DEFAULT_MATCH_RULESET_VERSION, isDefault: true };
    return { weights: stored.value, rulesetVersion: `custom-${stored.updatedAt.getTime()}`, isDefault: false };
  }
}
