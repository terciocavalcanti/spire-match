import type { PropertyDetail, PropertySummary } from "@spire/contracts";

import type { properties, propertyImages } from "../database/schema";

type PropertyRow = typeof properties.$inferSelect;
type PropertyImageRow = typeof propertyImages.$inferSelect;

export function toPropertySummary(row: PropertyRow): PropertySummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    purpose: row.purpose,
    status: row.status,
    price: Number(row.price),
    condominiumFee: row.condominiumFee === null ? null : Number(row.condominiumFee),
    iptu: row.iptu === null ? null : Number(row.iptu),
    areaSqm: Number(row.areaSqm),
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    parkingSpaces: row.parkingSpaces,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    location: row.lat !== null && row.lng !== null ? { lat: row.lat, lng: row.lng } : null,
    coverImageUrl: row.coverImageUrl,
    isExclusive: row.isExclusive,
    exclusiveType: row.exclusiveType,
    isSponsored: row.isSponsored,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toPropertyDetail(row: PropertyRow, images: PropertyImageRow[]): PropertyDetail {
  return {
    ...toPropertySummary(row),
    description: row.description,
    images: images
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((img) => ({ id: img.id, url: img.url, alt: img.alt, position: img.position })),
    features: row.features,
    acceptedPaymentMethods: row.acceptedPaymentMethods,
  };
}
