import { describe, expect, it } from "vitest";

import { computeMatchScore } from "./score";
import type { BuyerMatchProfile, PropertyMatchInput } from "./types";
import { DEFAULT_MATCH_WEIGHTS } from "./weights";

const baseBuyer: BuyerMatchProfile = {
  budgetMin: 1_000_000,
  budgetMax: 1_500_000,
  desiredNeighborhoods: ["Boa Viagem"],
  minAreaSqm: 90,
  minBedrooms: 3,
  minParkingSpaces: 2,
  purpose: "MORAR",
  paymentMethods: ["FINANCIAMENTO"],
  desiredFeatures: ["vista mar", "varanda gourmet"],
  currentLocation: null,
  hardExcludedPropertyIds: [],
};

const baseProperty: PropertyMatchInput = {
  id: "11111111-1111-1111-1111-111111111111",
  status: "AVAILABLE",
  price: 1_280_000,
  neighborhood: "Boa Viagem",
  city: "Recife",
  areaSqm: 104,
  bedrooms: 3,
  parkingSpaces: 2,
  purpose: "MORAR",
  acceptedPaymentMethods: ["FINANCIAMENTO", "A_VISTA"],
  features: ["vista mar", "varanda gourmet", "academia"],
  location: { lat: -8.1222, lng: -34.9021 },
};

describe("computeMatchScore", () => {
  it("retorna score alto quando orçamento, bairro, metragem e características batem", () => {
    const result = computeMatchScore(baseBuyer, baseProperty);
    expect(result.eliminated).toBe(false);
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.reasons.map((r) => r.code)).toEqual(
      expect.arrayContaining(["BUDGET_FIT", "PREFERRED_AREA", "AREA_FIT", "ROOMS_FIT"]),
    );
  });

  it("elimina imóvel indisponível independentemente do fit", () => {
    const result = computeMatchScore(baseBuyer, { ...baseProperty, status: "SOLD" });
    expect(result.eliminated).toBe(true);
    expect(result.eliminationReason).toBe("PROPERTY_UNAVAILABLE");
    expect(result.score).toBe(0);
  });

  it("elimina imóvel marcado pelo comprador como incompatibilidade essencial", () => {
    const buyer = { ...baseBuyer, hardExcludedPropertyIds: [baseProperty.id] };
    const result = computeMatchScore(buyer, baseProperty);
    expect(result.eliminated).toBe(true);
    expect(result.eliminationReason).toBe("BUYER_EXCLUDED_PROPERTY");
  });

  it("não pune o usuário por negar geolocalização (reponderação determinística)", () => {
    const buyerNoLocation = { ...baseBuyer, currentLocation: null };
    const buyerWithLocation = {
      ...baseBuyer,
      currentLocation: { lat: -8.12, lng: -34.9 }, // bem perto do imóvel
    };
    const withoutLocation = computeMatchScore(buyerNoLocation, baseProperty);
    const withLocation = computeMatchScore(buyerWithLocation, baseProperty);

    expect(withoutLocation.distanceMeters).toBeNull();
    expect(withoutLocation.distanceSource).toBeNull();
    // Sem localização, o score não deve ser menor do que com localização próxima.
    expect(withoutLocation.score).toBeGreaterThanOrEqual(withLocation.score - 5);
  });

  it("não inventa distância quando localização está ausente", () => {
    const result = computeMatchScore(baseBuyer, baseProperty);
    expect(result.distanceMeters).toBeNull();
    expect(result.reasons.find((r) => r.code === "NEARBY")).toBeUndefined();
  });

  it("decai score para preço acima do orçamento, sem zerar imediatamente", () => {
    const slightlyOver = computeMatchScore(baseBuyer, { ...baseProperty, price: 1_575_000 }); // +5%
    const wayOver = computeMatchScore(baseBuyer, { ...baseProperty, price: 1_950_000 }); // +30%
    const inBudget = computeMatchScore(baseBuyer, baseProperty);

    expect(slightlyOver.score).toBeLessThan(inBudget.score);
    expect(wayOver.score).toBeLessThan(slightlyOver.score);
  });

  it("patrocínio não altera o score (sem manipulação de ranking)", () => {
    const organic = computeMatchScore(baseBuyer, { ...baseProperty, isSponsored: false });
    const sponsored = computeMatchScore(baseBuyer, { ...baseProperty, isSponsored: true });
    expect(sponsored.score).toBe(organic.score);
  });

  it("é determinístico e estável para a mesma entrada", () => {
    const first = computeMatchScore(baseBuyer, baseProperty, DEFAULT_MATCH_WEIGHTS, "1.0.0", "2026-01-01T00:00:00.000Z");
    const second = computeMatchScore(baseBuyer, baseProperty, DEFAULT_MATCH_WEIGHTS, "1.0.0", "2026-01-01T00:00:00.000Z");
    expect(first).toEqual(second);
  });

  it("lida com dados faltantes do comprador sem lançar erro (missing data)", () => {
    const sparseBuyer: BuyerMatchProfile = {
      budgetMin: 0,
      budgetMax: 5_000_000,
      desiredNeighborhoods: [],
      minAreaSqm: null,
      minBedrooms: null,
      minParkingSpaces: null,
      purpose: null,
      paymentMethods: [],
      desiredFeatures: [],
      currentLocation: null,
      hardExcludedPropertyIds: [],
    };
    const result = computeMatchScore(sparseBuyer, baseProperty);
    expect(result.eliminated).toBe(false);
    expect(result.score).toBeGreaterThan(0);
    expect(Number.isFinite(result.score)).toBe(true);
  });
});
