import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type {
  AdminPropertyListQuery,
  CreatePropertyRequest,
  PropertyDetail,
  PropertyNearbyQuery,
  PropertySearchQuery,
  PropertySummary,
  UpdatePropertyRequest,
} from "@spire/contracts";
import { haversineDistanceMeters } from "@spire/domain";
import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

import type { Database } from "../database/client";
import { DATABASE } from "../database/database.module";
import { properties, propertyImages, propertyPriceHistory } from "../database/schema";

import { toPropertyDetail, toPropertySummary } from "./property-mapper";

function slugify(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

  async findByIdDetail(id: string): Promise<PropertyDetail | null> {
    const [row] = await this.db.select().from(properties).where(eq(properties.id, id)).limit(1);
    if (!row) return null;
    const images = await this.db.select().from(propertyImages).where(eq(propertyImages.propertyId, row.id));
    return toPropertyDetail(row, images);
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

  /** Lista administrativa: todos os status (inclusive rascunho/arquivado), não só os publicados. */
  async adminList(query: AdminPropertyListQuery): Promise<PropertyPage> {
    const offset = decodeCursor(query.cursor);
    const conditions = [];
    if (query.status) conditions.push(eq(properties.status, query.status));
    if (query.q) {
      conditions.push(or(ilike(properties.title, `%${query.q}%`), ilike(properties.neighborhood, `%${query.q}%`))!);
    }

    const rows = await this.db
      .select()
      .from(properties)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(properties.createdAt))
      .limit(query.limit + 1)
      .offset(offset);

    const hasMore = rows.length > query.limit;
    const pageRows = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items: pageRows.map(toPropertySummary),
      nextCursor: hasMore ? encodeCursor(offset + query.limit) : null,
    };
  }

  private async uniqueSlug(title: string, excludeId?: string): Promise<string> {
    const base = slugify(title) || "imovel";
    let candidate = base;
    let suffix = 1;
    for (;;) {

      const [existing] = await this.db.select({ id: properties.id }).from(properties).where(eq(properties.slug, candidate)).limit(1);
      if (!existing || existing.id === excludeId) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  async adminCreate(request: CreatePropertyRequest): Promise<PropertyDetail> {
    const slug = await this.uniqueSlug(request.title);
    const [row] = await this.db
      .insert(properties)
      .values({
        slug,
        title: request.title,
        description: request.description,
        type: request.type,
        purpose: request.purpose,
        status: request.status,
        price: request.price.toFixed(2),
        condominiumFee: request.condominiumFee != null ? request.condominiumFee.toFixed(2) : null,
        iptu: request.iptu != null ? request.iptu.toFixed(2) : null,
        areaSqm: request.areaSqm.toFixed(2),
        bedrooms: request.bedrooms,
        bathrooms: request.bathrooms,
        parkingSpaces: request.parkingSpaces,
        neighborhood: request.neighborhood,
        city: request.city,
        state: request.state.toUpperCase(),
        lat: request.lat ?? null,
        lng: request.lng ?? null,
        coverImageUrl: request.coverImageUrl ?? null,
        features: request.features,
        acceptedPaymentMethods: request.acceptedPaymentMethods,
        isExclusive: request.isExclusive,
        exclusiveType: request.exclusiveType ?? null,
        isSponsored: request.isSponsored,
        brokerId: request.brokerId ?? null,
      })
      .returning();
    if (!row) throw new Error("Falha ao criar imóvel");

    await this.db.insert(propertyPriceHistory).values({ propertyId: row.id, price: row.price });

    return toPropertyDetail(row, []);
  }

  async adminUpdate(id: string, request: UpdatePropertyRequest): Promise<PropertyDetail> {
    const [current] = await this.db.select().from(properties).where(eq(properties.id, id)).limit(1);
    if (!current) throw new NotFoundException({ code: "PROPERTY_NOT_FOUND", message: "Imóvel não encontrado" });

    const slug = request.title && request.title !== current.title ? await this.uniqueSlug(request.title, id) : current.slug;

    const [row] = await this.db
      .update(properties)
      .set({
        slug,
        ...(request.title !== undefined && { title: request.title }),
        ...(request.description !== undefined && { description: request.description }),
        ...(request.type !== undefined && { type: request.type }),
        ...(request.purpose !== undefined && { purpose: request.purpose }),
        ...(request.status !== undefined && { status: request.status }),
        ...(request.price !== undefined && { price: request.price.toFixed(2) }),
        ...(request.condominiumFee !== undefined && { condominiumFee: request.condominiumFee != null ? request.condominiumFee.toFixed(2) : null }),
        ...(request.iptu !== undefined && { iptu: request.iptu != null ? request.iptu.toFixed(2) : null }),
        ...(request.areaSqm !== undefined && { areaSqm: request.areaSqm.toFixed(2) }),
        ...(request.bedrooms !== undefined && { bedrooms: request.bedrooms }),
        ...(request.bathrooms !== undefined && { bathrooms: request.bathrooms }),
        ...(request.parkingSpaces !== undefined && { parkingSpaces: request.parkingSpaces }),
        ...(request.neighborhood !== undefined && { neighborhood: request.neighborhood }),
        ...(request.city !== undefined && { city: request.city }),
        ...(request.state !== undefined && { state: request.state.toUpperCase() }),
        ...(request.lat !== undefined && { lat: request.lat }),
        ...(request.lng !== undefined && { lng: request.lng }),
        ...(request.coverImageUrl !== undefined && { coverImageUrl: request.coverImageUrl }),
        ...(request.features !== undefined && { features: request.features }),
        ...(request.acceptedPaymentMethods !== undefined && { acceptedPaymentMethods: request.acceptedPaymentMethods }),
        ...(request.isExclusive !== undefined && { isExclusive: request.isExclusive }),
        ...(request.exclusiveType !== undefined && { exclusiveType: request.exclusiveType }),
        ...(request.isSponsored !== undefined && { isSponsored: request.isSponsored }),
        ...(request.brokerId !== undefined && { brokerId: request.brokerId }),
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();
    if (!row) throw new Error("Falha ao atualizar imóvel");

    if (request.price !== undefined && request.price.toFixed(2) !== current.price) {
      await this.db.insert(propertyPriceHistory).values({ propertyId: id, price: row.price });
    }

    const images = await this.db.select().from(propertyImages).where(eq(propertyImages.propertyId, id));
    return toPropertyDetail(row, images);
  }
}
