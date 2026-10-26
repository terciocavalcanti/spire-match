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
  brokerId: z.string().uuid().nullable(),
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

// --- Administração (CRUD de imóveis, Marco D) ---
export const createPropertyRequestSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(5000).default(""),
  type: propertyTypeSchema,
  purpose: listingPurposeSchema,
  status: propertyStatusSchema.default("DRAFT"),
  price: z.number().positive(),
  condominiumFee: z.number().nonnegative().nullable().optional(),
  iptu: z.number().nonnegative().nullable().optional(),
  areaSqm: z.number().positive(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  parkingSpaces: z.number().int().nonnegative(),
  neighborhood: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().length(2),
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  coverImageUrl: z.string().url().nullable().optional(),
  features: z.array(z.string().trim().min(1)).default([]),
  acceptedPaymentMethods: z.array(paymentMethodSchema).default([]),
  isExclusive: z.boolean().default(false),
  exclusiveType: exclusiveTypeSchema.nullable().optional(),
  isSponsored: z.boolean().default(false),
  brokerId: z.string().uuid().nullable().optional(),
});
export type CreatePropertyRequest = z.infer<typeof createPropertyRequestSchema>;

export const updatePropertyRequestSchema = createPropertyRequestSchema.partial();
export type UpdatePropertyRequest = z.infer<typeof updatePropertyRequestSchema>;

export const adminPropertyListQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  status: propertyStatusSchema.optional(),
  q: z.string().trim().min(1).optional(),
});
export type AdminPropertyListQuery = z.infer<typeof adminPropertyListQuerySchema>;

export const propertyNearbyQuerySchema = z.object({
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  radiusMeters: z.coerce.number().positive().max(50_000).default(5_000),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type PropertyNearbyQuery = z.infer<typeof propertyNearbyQuerySchema>;
