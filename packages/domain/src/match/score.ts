import { haversineDistanceMeters } from "./geo";
import type {
  BuyerMatchProfile,
  MatchReason,
  MatchResult,
  MatchWeights,
  PropertyMatchInput,
} from "./types";
import { DEFAULT_MATCH_RULESET_VERSION, DEFAULT_MATCH_WEIGHTS, reweightWithoutProximity } from "./weights";

// Dentro do orçamento = score 1. Acima do teto, decai linearmente até 0 em +20%.
const BUDGET_HARD_OVER_RATIO = 0.2;
// Metragem abaixo do mínimo decai linearmente até 0 em 50% do mínimo desejado.
const AREA_SOFT_FLOOR_RATIO = 0.5;
// Proximidade: score máximo até este raio, decaindo linearmente até 0 no raio máximo.
export const PROXIMITY_FULL_SCORE_RADIUS_METERS = 500;
export const PROXIMITY_MAX_RADIUS_METERS = 8_000;

const REASON_THRESHOLD = 0.75;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function scoreBudget(buyer: BuyerMatchProfile, property: PropertyMatchInput): number {
  if (property.price <= buyer.budgetMax) return 1;
  const overRatio = (property.price - buyer.budgetMax) / buyer.budgetMax;
  return clamp01(1 - overRatio / BUDGET_HARD_OVER_RATIO);
}

function scoreRegion(buyer: BuyerMatchProfile, property: PropertyMatchInput): number {
  if (buyer.desiredNeighborhoods.length === 0) return 1;
  if (buyer.desiredNeighborhoods.includes(property.neighborhood)) return 1;
  return 0;
}

function scoreArea(buyer: BuyerMatchProfile, property: PropertyMatchInput): number {
  if (buyer.minAreaSqm === null) return 1;
  if (property.areaSqm >= buyer.minAreaSqm) return 1;
  const floor = buyer.minAreaSqm * AREA_SOFT_FLOOR_RATIO;
  if (property.areaSqm <= floor) return 0;
  return clamp01((property.areaSqm - floor) / (buyer.minAreaSqm - floor));
}

function scoreRoomsFeatures(
  buyer: BuyerMatchProfile,
  property: PropertyMatchInput,
): { score: number; featuresScore: number } {
  const bedroomsScore =
    buyer.minBedrooms === null
      ? 1
      : property.bedrooms >= buyer.minBedrooms
        ? 1
        : clamp01(property.bedrooms / buyer.minBedrooms);
  const parkingScore =
    buyer.minParkingSpaces === null
      ? 1
      : property.parkingSpaces >= buyer.minParkingSpaces
        ? 1
        : clamp01(property.parkingSpaces / buyer.minParkingSpaces);
  const featuresScore =
    buyer.desiredFeatures.length === 0
      ? 1
      : buyer.desiredFeatures.filter((f) => property.features.includes(f)).length /
        buyer.desiredFeatures.length;

  return { score: bedroomsScore * 0.4 + parkingScore * 0.2 + featuresScore * 0.4, featuresScore };
}

function scorePurpose(buyer: BuyerMatchProfile, property: PropertyMatchInput): number {
  if (buyer.purpose === null) return 1;
  return property.purpose === buyer.purpose ? 1 : 0.3;
}

function scorePayment(buyer: BuyerMatchProfile, property: PropertyMatchInput): number {
  if (buyer.paymentMethods.length === 0) return 1;
  return buyer.paymentMethods.some((m) => property.acceptedPaymentMethods.includes(m)) ? 1 : 0;
}

function scoreProximity(
  buyer: BuyerMatchProfile,
  property: PropertyMatchInput,
): { score: number; distanceMeters: number | null } {
  if (!buyer.currentLocation || !property.location) {
    return { score: 0, distanceMeters: null };
  }
  const distanceMeters = haversineDistanceMeters(buyer.currentLocation, property.location);
  if (distanceMeters <= PROXIMITY_FULL_SCORE_RADIUS_METERS) {
    return { score: 1, distanceMeters };
  }
  const ratio =
    (distanceMeters - PROXIMITY_FULL_SCORE_RADIUS_METERS) /
    (PROXIMITY_MAX_RADIUS_METERS - PROXIMITY_FULL_SCORE_RADIUS_METERS);
  return { score: clamp01(1 - ratio), distanceMeters };
}

/**
 * Motor de compatibilidade SPIRE MATCH — score 0-100 por par comprador-imóvel.
 * Puro e determinístico: sem I/O, sem aleatoriedade, testável em isolamento.
 * Patrocínio (`property.isSponsored`) NUNCA entra no cálculo do score
 * (seção 4.5 do prompt mestre — posição patrocinada é separada do ranking).
 */
export function computeMatchScore(
  buyer: BuyerMatchProfile,
  property: PropertyMatchInput,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS,
  rulesetVersion: string = DEFAULT_MATCH_RULESET_VERSION,
  computedAt: string = new Date().toISOString(),
): MatchResult {
  if (property.status !== "AVAILABLE") {
    return {
      propertyId: property.id,
      score: 0,
      rulesetVersion,
      reasons: [],
      distanceMeters: null,
      distanceSource: null,
      eliminated: true,
      eliminationReason: "PROPERTY_UNAVAILABLE",
      computedAt,
    };
  }
  if (buyer.hardExcludedPropertyIds.includes(property.id)) {
    return {
      propertyId: property.id,
      score: 0,
      rulesetVersion,
      reasons: [],
      distanceMeters: null,
      distanceSource: null,
      eliminated: true,
      eliminationReason: "BUYER_EXCLUDED_PROPERTY",
      computedAt,
    };
  }

  const { score: proximity, distanceMeters } = scoreProximity(buyer, property);
  const hasLocation = distanceMeters !== null;
  const effectiveWeights = hasLocation ? weights : reweightWithoutProximity(weights);

  const budget = scoreBudget(buyer, property);
  const region = scoreRegion(buyer, property);
  const area = scoreArea(buyer, property);
  const { score: roomsFeatures, featuresScore } = scoreRoomsFeatures(buyer, property);
  const purpose = scorePurpose(buyer, property);
  const payment = scorePayment(buyer, property);
  const preferenceSignals = buyer.preferenceSignalScore ?? 0.5;

  const weighted =
    budget * effectiveWeights.budget +
    region * effectiveWeights.region +
    (hasLocation ? proximity * (effectiveWeights as MatchWeights).proximity : 0) +
    area * effectiveWeights.area +
    roomsFeatures * effectiveWeights.roomsFeatures +
    purpose * effectiveWeights.purpose +
    payment * effectiveWeights.payment +
    preferenceSignals * effectiveWeights.preferenceSignals;

  const score = Math.round(clamp01(weighted) * 100);

  const reasons: MatchReason[] = [];
  if (budget >= REASON_THRESHOLD) reasons.push({ code: "BUDGET_FIT", label: "Dentro do seu orçamento" });
  if (region >= REASON_THRESHOLD) reasons.push({ code: "PREFERRED_AREA", label: "No bairro que você procura" });
  if (hasLocation && proximity >= 0.6) reasons.push({ code: "NEARBY", label: "Perto de você" });
  if (area >= REASON_THRESHOLD) reasons.push({ code: "AREA_FIT", label: "Metragem compatível" });
  if (roomsFeatures >= REASON_THRESHOLD) reasons.push({ code: "ROOMS_FIT", label: "Número de quartos ideal" });
  if (featuresScore >= REASON_THRESHOLD && buyer.desiredFeatures.length > 0)
    reasons.push({ code: "FEATURES_FIT", label: "Com as características que você busca" });
  if (purpose === 1) reasons.push({ code: "PURPOSE_FIT", label: "Alinhado ao seu objetivo" });
  if (payment === 1 && buyer.paymentMethods.length > 0)
    reasons.push({ code: "PAYMENT_FIT", label: "Aceita sua forma de pagamento" });
  if (preferenceSignals >= REASON_THRESHOLD)
    reasons.push({ code: "PREFERENCE_SIGNAL", label: "Parecido com imóveis que você curtiu" });

  return {
    propertyId: property.id,
    score,
    rulesetVersion,
    reasons,
    distanceMeters,
    distanceSource: hasLocation ? "GEOLOCATION_API" : null,
    eliminated: false,
    eliminationReason: null,
    computedAt,
  };
}
