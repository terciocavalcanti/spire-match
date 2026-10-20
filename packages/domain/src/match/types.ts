import type { GeoPoint, ListingPurpose, MatchReasonCode, PaymentMethod, PropertyStatus } from "@spire/contracts";

export type { GeoPoint, ListingPurpose, MatchReasonCode, PaymentMethod, PropertyStatus };

export interface BuyerMatchProfile {
  budgetMin: number;
  budgetMax: number;
  desiredNeighborhoods: string[];
  minAreaSqm: number | null;
  minBedrooms: number | null;
  minParkingSpaces: number | null;
  purpose: ListingPurpose | null;
  paymentMethods: PaymentMethod[];
  desiredFeatures: string[];
  /** Localização obtida via Geolocation API durante a sessão — null quando negada/indisponível. */
  currentLocation: GeoPoint | null;
  /** IDs de imóveis marcados pelo comprador como incompatibilidade essencial (DISLIKE forte). */
  hardExcludedPropertyIds: string[];
  /** Score 0..1 derivado de sinais de interação prévios (likes/views em imóveis similares). Opcional. */
  preferenceSignalScore?: number;
}

export interface PropertyMatchInput {
  id: string;
  status: PropertyStatus;
  price: number;
  neighborhood: string;
  city: string;
  areaSqm: number;
  bedrooms: number;
  parkingSpaces: number;
  purpose: ListingPurpose;
  acceptedPaymentMethods: PaymentMethod[];
  features: string[];
  location: GeoPoint | null;
  isSponsored?: boolean;
}

export interface MatchWeights {
  budget: number;
  region: number;
  proximity: number;
  area: number;
  roomsFeatures: number;
  purpose: number;
  payment: number;
  preferenceSignals: number;
}

export interface MatchReason {
  code: MatchReasonCode;
  label: string;
}

export type MatchEliminationReason =
  | "PROPERTY_UNAVAILABLE"
  | "BUYER_EXCLUDED_PROPERTY";

export interface MatchResult {
  propertyId: string;
  score: number; // 0-100, 0 quando eliminado
  rulesetVersion: string;
  reasons: MatchReason[];
  distanceMeters: number | null;
  distanceSource: "GEOLOCATION_API" | null;
  eliminated: boolean;
  eliminationReason: MatchEliminationReason | null;
  computedAt: string;
}
