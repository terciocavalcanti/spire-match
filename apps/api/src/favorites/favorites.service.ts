import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { Favorite } from "@spire/contracts";
import { and, desc, eq } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { favorites, properties } from "../database/schema";
import { toPropertySummary } from "../properties/property-mapper";

@Injectable()
export class FavoritesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async list(userId: string): Promise<Favorite[]> {
    const rows = await this.db
      .select({ favorite: favorites, property: properties })
      .from(favorites)
      .innerJoin(properties, eq(properties.id, favorites.propertyId))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));

    return rows.map(({ favorite, property }) => ({
      id: favorite.id,
      propertyId: favorite.propertyId,
      createdAt: favorite.createdAt.toISOString(),
      property: toPropertySummary(property),
    }));
  }

  async add(userId: string, propertyId: string): Promise<void> {
    const [property] = await this.db.select({ id: properties.id }).from(properties).where(eq(properties.id, propertyId)).limit(1);
    if (!property) {
      throw new NotFoundException({ code: "PROPERTY_NOT_FOUND", message: "Imóvel não encontrado" });
    }
    await this.db.insert(favorites).values({ userId, propertyId }).onConflictDoNothing({
      target: [favorites.userId, favorites.propertyId],
    });
  }

  async remove(userId: string, propertyId: string): Promise<void> {
    await this.db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.propertyId, propertyId)));
  }
}
