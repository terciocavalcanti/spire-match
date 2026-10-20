import { Inject, Injectable } from "@nestjs/common";
import type {
  PropertyDetail,
  PropertyNearbyQuery,
  PropertySearchQuery,
  PropertySummary,
} from "@spire/contracts";
import { haversineDistanceMeters } from "@spire/domain";
import { and, asc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { properties, propertyImages } from "../database/schema";

import { toPropertyDetail, toPropertySummary } from "./property-mapper";

function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  const decoded = Number(Buffer.from(cursor, "base64url").toString("utf8"));
  return Number.isFinite(decoded) && decoded >= 0 ? decoded : 0;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), "utf8").toString("base64url");
}

export interface PropertyPage {
  items: PropertySummary[];
  nextCursor: string | null;
}

@Injectable()
export class PropertiesService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async search(query: PropertySearchQuery): Promise<PropertyPage> {
    const offset = decodeCursor(query.cursor);

    const conditions = [eq(properties.status, "AVAILABLE")];
    if (query.q) {
      conditions.push(
        or(ilike(properties.title, `%${query.q}%`), ilike(properties.neighborhood, `%${query.q}%`))!,
      );
    }
    if (query.neighborhoods?.length) {
      conditions.push(inArray(properties.neighborhood, query.neighborhoods));
    }
    if (query.type) conditions.push(eq(properties.type, query.type));
    if (query.purpose) conditions.push(eq(properties.purpose, query.purpose));
    if (query.priceMin !== undefined) conditions.push(gte(properties.price, query.priceMin.toFixed(2)));
    if (query.priceMax !== undefined) conditions.push(lte(properties.price, query.priceMax.toFixed(2)));
    if (query.areaMin !== undefined) conditions.push(gte(properties.areaSqm, query.areaMin.toFixed(2)));
    if (query.bedroomsMin !== undefined) conditions.push(gte(properties.bedrooms, query.bedroomsMin));
    if (query.parkingMin !== undefined) conditions.push(gte(properties.parkingSpaces, query.parkingMin));
    if (query.exclusivesOnly) conditions.push(eq(properties.isExclusive, true));

    const rows = await this.db
      .select()
      .from(properties)
      .where(and(...conditions))
      .orderBy(asc(properties.createdAt))
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items: pageRows.map(toPropertySummary),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  async findBySlug(slug: string): Promise<PropertyDetail | null> {
    const [row] = await this.db.select().from(properties).where(eq(properties.slug, slug)).limit(1);
    if (!row) return null;
    const images = await this.db.select().from(propertyImages).where(eq(propertyImages.propertyId, row.id));
    return toPropertyDetail(row, images);
  }

  async findById(id: string) {
    const [row] = await this.db.select().from(properties).where(eq(properties.id, id)).limit(1);
    return row ?? null;
  }

  /**
   * Pré-filtra por bounding box (indexado em `lat`/`lng`) e depois ordena
   * pela distância haversine exata — ver nota de simplificação do Marco B em
   * `apps/api/src/database/schema/properties.ts` (coluna `geography` do
   * PostGIS fica para quando o volume de imóveis justificar `ST_DWithin`).
   */
  async nearby(query: PropertyNearbyQuery): Promise<Array<PropertySummary & { distanceMeters: number }>> {
    const latDelta = query.radiusMeters / 111_320; // ~metros por grau de latitude
    const lngDelta =
      query.radiusMeters / (111_320 * Math.cos((query.lat * Math.PI) / 180) || 1);

    const rows = await this.db
      .select()
      .from(properties)
      .where(
        and(
          eq(properties.status, "AVAILABLE"),
          sql`${properties.lat} is not null`,
          sql`${properties.lng} is not null`,
          gte(properties.lat, query.lat - latDelta),
          lte(properties.lat, query.lat + latDelta),
          gte(properties.lng, query.lng - lngDelta),
          lte(properties.lng, query.lng + lngDelta),
        ),
      );

    return rows
      .map((row) => {
        const distanceMeters = haversineDistanceMeters(
          { lat: query.lat, lng: query.lng },
          { lat: row.lat!, lng: row.lng! },
        );
        return { ...toPropertySummary(row), distanceMeters };
      })
      .filter((item) => item.distanceMeters <= query.radiusMeters)
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, query.limit);
  }

  /** Lista todos os imóveis disponíveis — usado pelo MatchService para pontuar contra o perfil do comprador. */
  async listAvailable() {
    return this.db.select().from(properties).where(eq(properties.status, "AVAILABLE"));
  }
}
