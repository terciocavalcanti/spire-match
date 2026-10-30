import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { platformSettings } from "../database/schema";

// Comissão padrão quando o admin ainda não configurou nada em D5 (5%) —
// documentado aqui, não escondido num número mágico espalhado pelo código.
export const DEFAULT_COMMISSION_RATE = 0.05;

@Injectable()
export class SettingsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async get<T>(key: string, fallback: T): Promise<T> {
    const [row] = await this.db.select().from(platformSettings).where(eq(platformSettings.key, key)).limit(1);
    return row ? (row.value as T) : fallback;
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
}
