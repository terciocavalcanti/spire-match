import { Inject, Injectable } from "@nestjs/common";
import type { MatchResult } from "@spire/contracts";
import {
  DEFAULT_MATCH_RULESET_VERSION,
  DEFAULT_MATCH_WEIGHTS,
  computeMatchScore,
  type BuyerMatchProfile,
  type PropertyMatchInput,
} from "@spire/domain";
import { desc, eq, inArray, sql } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import {
  buyerProfiles,
  matchResults,
  properties,
  roleAssignments,
  roles,
  userInteractions,
} from "../database/schema";
import { toPropertySummary } from "../properties/property-mapper";

type PropertyRow = typeof properties.$inferSelect;

function toPropertyMatchInput(row: PropertyRow): PropertyMatchInput {
  return {
    id: row.id,
    status: row.status,
    price: Number(row.price),
    neighborhood: row.neighborhood,
    city: row.city,
    areaSqm: Number(row.areaSqm),
    bedrooms: row.bedrooms,
    parkingSpaces: row.parkingSpaces,
    purpose: row.purpose,
    acceptedPaymentMethods: row.acceptedPaymentMethods,
    features: row.features,
    location: row.lat !== null && row.lng !== null ? { lat: row.lat, lng: row.lng } : null,
    isSponsored: row.isSponsored,
  };
}

@Injectable()
export class MatchesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  private async buildBuyerProfile(
    userId: string,
    location: { lat: number; lng: number } | null,
  ): Promise<BuyerMatchProfile> {
    const [profileRow] = await this.db.select().from(buyerProfiles).where(eq(buyerProfiles.userId, userId)).limit(1);

    // Última interação por imóvel: DISLIKE mais recente que qualquer LIKE/FAVORITE
    // posterior é tratado como incompatibilidade essencial (seção 4.3).
    const interactions = await this.db
      .select({ propertyId: userInteractions.propertyId, type: userInteractions.type, createdAt: userInteractions.createdAt })
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId))
      .orderBy(desc(userInteractions.createdAt));

    const latestByProperty = new Map<string, string>();
    for (const interaction of interactions) {
      if (!latestByProperty.has(interaction.propertyId)) {
        latestByProperty.set(interaction.propertyId, interaction.type);
      }
    }
    const hardExcludedPropertyIds = [...latestByProperty.entries()]
      .filter(([, type]) => type === "DISLIKE")
      .map(([propertyId]) => propertyId);

    return {
      budgetMin: profileRow?.budgetMin ? Number(profileRow.budgetMin) : 0,
      budgetMax: profileRow?.budgetMax ? Number(profileRow.budgetMax) : Number.POSITIVE_INFINITY,
      desiredNeighborhoods: profileRow?.desiredNeighborhoods ?? [],
      minAreaSqm: profileRow?.minAreaSqm ? Number(profileRow.minAreaSqm) : null,
      minBedrooms: profileRow?.minBedrooms ?? null,
      minParkingSpaces: profileRow?.minParkingSpaces ?? null,
      purpose: profileRow?.purpose ?? null,
      paymentMethods: profileRow?.paymentMethods ?? [],
      desiredFeatures: profileRow?.desiredFeatures ?? [],
      currentLocation: location,
      hardExcludedPropertyIds,
    };
  }

  private toDto(result: ReturnType<typeof computeMatchScore>, property: PropertyRow): MatchResult {
    return {
      propertyId: result.propertyId,
      score: result.score,
      rulesetVersion: result.rulesetVersion,
      reasons: result.reasons,
      distanceMeters: result.distanceMeters,
      distanceSource: result.distanceSource,
      computedAt: result.computedAt,
      property: toPropertySummary(property),
    };
  }

  private async persist(userId: string, results: ReturnType<typeof computeMatchScore>[]): Promise<void> {
    if (results.length === 0) return;
    await this.db
      .insert(matchResults)
      .values(
        results.map((r) => ({
          userId,
          propertyId: r.propertyId,
          score: r.score,
          rulesetVersion: r.rulesetVersion,
          reasons: r.reasons,
          distanceMeters: r.distanceMeters,
          distanceSource: r.distanceSource,
          eliminated: r.eliminated,
          eliminationReason: r.eliminationReason,
          computedAt: new Date(r.computedAt),
        })),
      )
      .onConflictDoUpdate({
        target: [matchResults.userId, matchResults.propertyId],
        set: {
          score: sql`excluded.score`,
          rulesetVersion: sql`excluded.ruleset_version`,
          reasons: sql`excluded.reasons`,
          distanceMeters: sql`excluded.distance_meters`,
          distanceSource: sql`excluded.distance_source`,
          eliminated: sql`excluded.eliminated`,
          eliminationReason: sql`excluded.elimination_reason`,
          computedAt: sql`excluded.computed_at`,
        },
      });
  }

  async computeAllForUser(
    userId: string,
    location: { lat: number; lng: number } | null,
  ): Promise<MatchResult[]> {
    const buyer = await this.buildBuyerProfile(userId, location);
    const availableProperties = await this.db.select().from(properties).where(eq(properties.status, "AVAILABLE"));

    const computed = availableProperties.map((property) =>
      computeMatchScore(buyer, toPropertyMatchInput(property), DEFAULT_MATCH_WEIGHTS, DEFAULT_MATCH_RULESET_VERSION),
    );

    await this.persist(userId, computed);

    const byId = new Map(availableProperties.map((p) => [p.id, p]));
    return computed
      .filter((r) => !r.eliminated)
      .sort((a, b) => b.score - a.score)
      .map((r) => this.toDto(r, byId.get(r.propertyId)!));
  }

  async computeForProperty(
    userId: string,
    propertyId: string,
    location: { lat: number; lng: number } | null,
  ): Promise<MatchResult | null> {
    const [property] = await this.db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
    if (!property) return null;

    const buyer = await this.buildBuyerProfile(userId, location);
    const result = computeMatchScore(
      buyer,
      toPropertyMatchInput(property),
      DEFAULT_MATCH_WEIGHTS,
      DEFAULT_MATCH_RULESET_VERSION,
    );
    await this.persist(userId, [result]);
    return this.toDto(result, property);
  }

  /**
   * Recalcula e persiste o score deste imóvel para todo comprador (papel
   * BUYER) — disparado de forma assíncrona (fila `match-recalc-property`,
   * ver QueueService) quando um imóvel é criado/editado no admin, em vez de
   * recalcular tudo de forma síncrona dentro da requisição HTTP.
   */
  async recalculateForProperty(propertyId: string): Promise<{ buyersScored: number }> {
    const [property] = await this.db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
    if (!property) return { buyersScored: 0 };

    const buyerRows = await this.db
      .select({ userId: roleAssignments.userId })
      .from(roleAssignments)
      .innerJoin(roles, eq(roles.id, roleAssignments.roleId))
      .where(eq(roles.name, "BUYER"));

    const propertyInput = toPropertyMatchInput(property);
    for (const { userId } of buyerRows) {
      // Sem localização ao vivo em segundo plano — o peso de proximidade é
      // redistribuído automaticamente (mesma regra do caminho síncrono).
      const buyer = await this.buildBuyerProfile(userId, null);
      const result = computeMatchScore(buyer, propertyInput, DEFAULT_MATCH_WEIGHTS, DEFAULT_MATCH_RULESET_VERSION);
      await this.persist(userId, [result]);
    }

    return { buyersScored: buyerRows.length };
  }

  async computeForPropertyIds(
    userId: string,
    propertyIds: string[],
    location: { lat: number; lng: number } | null,
  ): Promise<Map<string, MatchResult>> {
    if (propertyIds.length === 0) return new Map();
    const rows = await this.db.select().from(properties).where(inArray(properties.id, propertyIds));
    const buyer = await this.buildBuyerProfile(userId, location);
    const map = new Map<string, MatchResult>();
    for (const property of rows) {
      const result = computeMatchScore(
        buyer,
        toPropertyMatchInput(property),
        DEFAULT_MATCH_WEIGHTS,
        DEFAULT_MATCH_RULESET_VERSION,
      );
      map.set(property.id, this.toDto(result, property));
    }
    return map;
  }
}
