import { Inject, Injectable } from "@nestjs/common";
import type { DemandMatchQuery, DemandMatchResult } from "@spire/contracts";
import { and, eq, sql } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { buyerProfiles } from "../database/schema";
import { SettingsService } from "../settings/settings.service";

@Injectable()
export class DemandMatchService {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly settings: SettingsService,
  ) {}

  /**
   * Contagem agregada calculada sob demanda (sem snapshot/job) — sempre
   * fresca, nunca stale. Um perfil sem bairro/orçamento definido é tratado
   * como compatível com qualquer bairro/faixa (não exclui, não força
   * match): só exclui quando o comprador definiu algo que conflita.
   * Nunca revela uma contagem abaixo do limiar configurável
   * (platform_settings.demandMatchThreshold) — anti-identificação (4.8).
   */
  async compute(query: DemandMatchQuery): Promise<DemandMatchResult> {
    const threshold = await this.settings.getDemandMatchThreshold();

    const conditions = [sql`${query.neighborhood} = ANY(${buyerProfiles.desiredNeighborhoods})`];
    if (query.purpose) conditions.push(eq(buyerProfiles.purpose, query.purpose));
    if (query.priceMin !== undefined) {
      conditions.push(sql`(${buyerProfiles.budgetMax} IS NULL OR ${buyerProfiles.budgetMax} >= ${query.priceMin})`);
    }
    if (query.priceMax !== undefined) {
      conditions.push(sql`(${buyerProfiles.budgetMin} IS NULL OR ${buyerProfiles.budgetMin} <= ${query.priceMax})`);
    }

    const [row] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(buyerProfiles)
      .where(and(...conditions));
    const count = row?.count ?? 0;

    const computedAt = new Date().toISOString();
    if (count < threshold) {
      return { count: null, threshold, reason: "ABAIXO_DO_LIMIAR", computedAt };
    }
    return { count, threshold, reason: null, computedAt };
  }
}
