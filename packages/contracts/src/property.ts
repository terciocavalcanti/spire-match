import { z } from "zod";

export const PROPERTY_STATUSES = ["DRAFT", "AVAILABLE", "RESERVED", "SOLD", "RENTED", "INACTIVE"] as const;
export const propertyStatusSchema = z.enum(PROPERTY_STATUSES);
export type PropertyStatus = z.infer<typeof propertyStatusSchema>;

export const PROPERTY_TYPES = ["APARTAMENTO", "CASA", "COBERTURA"] as const;
export const propertyTypeSchema = z.enum(PROPERTY_TYPES);
export type PropertyType = z.infer<typeof propertyTypeSchema>;

export const LISTING_PURPOSES = ["MORAR", "INVESTIR"] as const;
export const listingPurposeSchema = z.enum(LISTING_PURPOSES);
export type ListingPurpose = z.infer<typeof listingPurposeSchema>;

export const PAYMENT_METHODS = ["A_VISTA", "FINANCIAMENTO", "CONSORCIO", "PERMUTA"] as const;
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const EXCLUSIVE_TYPES = ["EXCLUSIVO", "PRE_LANCAMENTO", "OPORTUNIDADE"] as const;
export const exclusiveTypeSchema = z.enum(EXCLUSIVE_TYPES);
export type ExclusiveType = z.infer<typeof exclusiveTypeSchema>;

export const geoPointSchema = z.object({ lat: z.number(), lng: z.number() });
export type GeoPoint = z.infer<typeof geoPointSchema>;

export const propertyImageSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  alt: z.string(),
  position: z.number().int(),
});
export type PropertyImage = z.infer<typeof propertyImageSchema>;

export const propertySummarySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  type: propertyTypeSchema,
  purpose: listingPurposeSchema,
  status: propertyStatusSchema,
  price: z.number(),
  condominiumFee: z.number().nullable(),
  iptu: z.number().nullable(),
  areaSqm: z.number(),
  bedrooms: z.number().int(),
  bathrooms: z.number().int(),
  parkingSpaces: z.number().int(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  location: geoPointSchema.nullable(),
  coverImageUrl: z.string().url().nullable(),
  isExclusive: z.boolean(),
  exclusiveType: exclusiveTypeSchema.nullable(),
  isSponsored: z.boolean(),
  createdAt: z.string().datetime(),
});
export type PropertySummary = z.infer<typeof propertySummarySchema>;

export const propertyDetailSchema = propertySummarySchema.extend({
  description: z.string(),
  images: z.array(propertyImageSchema),
  features: z.array(z.string()),
  acceptedPaymentMethods: z.array(paymentMethodSchema),
});
export type PropertyDetail = z.infer<typeof propertyDetailSchema>;

export const propertySearchQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().min(1).optional(),
  neighborhoods: z
    .union([z.array(z.string()), z.string()])
    .transform((v) => (Array.isArray(v) ? v : [v]))
    .optional(),
  type: propertyTypeSchema.optional(),
  purpose: listingPurposeSchema.optional(),
  priceMin: z.coerce.number().nonnegative().optional(),
  priceMax: z.coerce.number().nonnegative().optional(),
  areaMin: z.coerce.number().nonnegative().optional(),
  bedroomsMin: z.coerce.number().int().nonnegative().optional(),
  parkingMin: z.coerce.number().int().nonnegative().optional(),
  exclusivesOnly: z.coerce.boolean().optional(),
});
export type PropertySearchQuery = z.infer<typeof propertySearchQuerySchema>;

export const propertyNearbyQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusMeters: z.coerce.number().positive().max(50_000).default(5_000),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type PropertyNearbyQuery = z.infer<typeof propertyNearbyQuerySchema>;
