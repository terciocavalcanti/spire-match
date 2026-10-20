import { Inject, Injectable } from "@nestjs/common";
import type { BuyerPreferences, UpdateBuyerPreferencesRequest } from "@spire/contracts";
import { eq } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { buyerProfiles } from "../database/schema";

type BuyerProfileRow = typeof buyerProfiles.$inferSelect;

function toDto(row: BuyerProfileRow): BuyerPreferences {
  return {
    budgetMin: row.budgetMin === null ? null : Number(row.budgetMin),
    budgetMax: row.budgetMax === null ? null : Number(row.budgetMax),
    desiredNeighborhoods: row.desiredNeighborhoods,
    minAreaSqm: row.minAreaSqm === null ? null : Number(row.minAreaSqm),
    minBedrooms: row.minBedrooms,
    minParkingSpaces: row.minParkingSpaces,
    purpose: row.purpose,
    paymentMethods: row.paymentMethods,
    desiredFeatures: row.desiredFeatures,
    onboardingCompletedAt: row.onboardingCompletedAt?.toISOString() ?? null,
  };
}

const EMPTY_PREFERENCES: BuyerPreferences = {
  budgetMin: null,
  budgetMax: null,
  desiredNeighborhoods: [],
  minAreaSqm: null,
  minBedrooms: null,
  minParkingSpaces: null,
  purpose: null,
  paymentMethods: [],
  desiredFeatures: [],
  onboardingCompletedAt: null,
};

@Injectable()
export class BuyerProfileService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async get(userId: string): Promise<BuyerPreferences> {
    const [row] = await this.db.select().from(buyerProfiles).where(eq(buyerProfiles.userId, userId)).limit(1);
    return row ? toDto(row) : EMPTY_PREFERENCES;
  }

  async getRow(userId: string): Promise<BuyerProfileRow | null> {
    const [row] = await this.db.select().from(buyerProfiles).where(eq(buyerProfiles.userId, userId)).limit(1);
    return row ?? null;
  }

  async update(userId: string, patch: UpdateBuyerPreferencesRequest): Promise<BuyerPreferences> {
    const existing = await this.getRow(userId);

    const values = {
      budgetMin: patch.budgetMin !== undefined ? patch.budgetMin?.toFixed(2) ?? null : existing?.budgetMin ?? null,
      budgetMax: patch.budgetMax !== undefined ? patch.budgetMax?.toFixed(2) ?? null : existing?.budgetMax ?? null,
      desiredNeighborhoods: patch.desiredNeighborhoods ?? existing?.desiredNeighborhoods ?? [],
      minAreaSqm:
        patch.minAreaSqm !== undefined ? patch.minAreaSqm?.toFixed(2) ?? null : existing?.minAreaSqm ?? null,
      minBedrooms: patch.minBedrooms !== undefined ? patch.minBedrooms : (existing?.minBedrooms ?? null),
      minParkingSpaces:
        patch.minParkingSpaces !== undefined ? patch.minParkingSpaces : (existing?.minParkingSpaces ?? null),
      purpose: patch.purpose !== undefined ? patch.purpose : (existing?.purpose ?? null),
      paymentMethods: patch.paymentMethods ?? existing?.paymentMethods ?? [],
      desiredFeatures: patch.desiredFeatures ?? existing?.desiredFeatures ?? [],
      onboardingCompletedAt: patch.completeOnboarding ? new Date() : (existing?.onboardingCompletedAt ?? null),
      updatedAt: new Date(),
    };

    const [row] = await this.db
      .insert(buyerProfiles)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: buyerProfiles.userId, set: values })
      .returning();

    return toDto(row!);
  }
}
