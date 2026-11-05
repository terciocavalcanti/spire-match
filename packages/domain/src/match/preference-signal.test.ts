import { describe, expect, it } from "vitest";

import { computePreferenceSignalScore, inferPreferenceSuggestions, type PreferenceSignalSample } from "./preference-signal";
import type { PropertyMatchInput } from "./types";

const baseProperty: PropertyMatchInput = {
  id: "11111111-1111-1111-1111-111111111111",
  status: "AVAILABLE",
  price: 1_200_000,
  neighborhood: "Boa Viagem",
  city: "Recife",
  areaSqm: 100,
  bedrooms: 3,
  parkingSpaces: 2,
  purpose: "MORAR",
  acceptedPaymentMethods: ["FINANCIAMENTO"],
  features: ["vista mar", "varanda gourmet"],
  location: null,
};

describe("computePreferenceSignalScore", () => {
  it("devolve 0.5 (neutro) sem nenhuma amostra — nunca penaliza quem não interagiu", () => {
    expect(computePreferenceSignalScore([], baseProperty)).toBe(0.5);
  });

  it("score alto quando o candidato é parecido com o que o comprador curtiu", () => {
    const samples: PreferenceSignalSample[] = [
      { neighborhood: "Boa Viagem", price: 1_200_000, bedrooms: 3, features: ["vista mar", "varanda gourmet"] },
      { neighborhood: "Boa Viagem", price: 1_150_000, bedrooms: 3, features: ["vista mar"] },
    ];
    const score = computePreferenceSignalScore(samples, baseProperty);
    expect(score).toBeGreaterThan(0.85);
  });

  it("normaliza featuresScore pelas características do CANDIDATO, não pelo total de características curtidas (regressão real encontrada contra dados de seed)", () => {
    // Histórico de curtidas acumula 6 características distintas no total,
    // mas o candidato só tem 2, com 1 em comum ("próximo da praia") — o
    // score de características deve ser 1/2 (do candidato), não 1/6 (do
    // conjunto acumulado), senão um candidato com poucas características
    // nunca consegue pontuar bem mesmo sendo genuinamente parecido.
    const samples: PreferenceSignalSample[] = [
      { neighborhood: "Boa Viagem", price: 1_280_000, bedrooms: 3, features: ["vista mar", "varanda gourmet", "academia", "piscina"] },
      { neighborhood: "Boa Viagem", price: 2_980_000, bedrooms: 3, features: ["vista mar", "varanda gourmet", "piscina", "salão de festas"] },
      { neighborhood: "Boa Viagem", price: 680_000, bedrooms: 2, features: ["próximo da praia"] },
    ];
    const candidate: PropertyMatchInput = { ...baseProperty, price: 1_050_000, bedrooms: 3, features: ["próximo da praia", "varanda"] };
    const score = computePreferenceSignalScore(samples, candidate);
    expect(score).toBeGreaterThanOrEqual(0.75);
  });

  it("score baixo quando o candidato é bem diferente do que o comprador curtiu", () => {
    const samples: PreferenceSignalSample[] = [
      { neighborhood: "Casa Forte", price: 300_000, bedrooms: 1, features: ["portaria 24h"] },
      { neighborhood: "Casa Forte", price: 320_000, bedrooms: 1, features: ["portaria 24h"] },
    ];
    const score = computePreferenceSignalScore(samples, baseProperty);
    expect(score).toBeLessThan(0.3);
  });
});

describe("inferPreferenceSuggestions", () => {
  it("não sugere nada com menos de 3 amostras", () => {
    const samples: PreferenceSignalSample[] = [
      { neighborhood: "Boa Viagem", price: 1_000_000, bedrooms: 3, features: [] },
      { neighborhood: "Boa Viagem", price: 1_000_000, bedrooms: 3, features: [] },
    ];
    expect(inferPreferenceSuggestions(samples, { desiredNeighborhoods: [], desiredFeatures: [] })).toEqual([]);
  });

  it("sugere um bairro com padrão real (≥3 amostras, ≥40% de confiança)", () => {
    const samples: PreferenceSignalSample[] = [
      { neighborhood: "Boa Viagem", price: 1_000_000, bedrooms: 3, features: [] },
      { neighborhood: "Boa Viagem", price: 1_050_000, bedrooms: 3, features: [] },
      { neighborhood: "Boa Viagem", price: 980_000, bedrooms: 2, features: [] },
      { neighborhood: "Casa Forte", price: 2_000_000, bedrooms: 4, features: [] },
    ];
    const suggestions = inferPreferenceSuggestions(samples, { desiredNeighborhoods: [], desiredFeatures: [] });
    expect(suggestions).toContainEqual(expect.objectContaining({ type: "NEIGHBORHOOD", value: "Boa Viagem", sampleCount: 3 }));
  });

  it("nunca sugere um bairro ou característica já confirmados", () => {
    const samples: PreferenceSignalSample[] = [
      { neighborhood: "Boa Viagem", price: 1_000_000, bedrooms: 3, features: ["vista mar"] },
      { neighborhood: "Boa Viagem", price: 1_000_000, bedrooms: 3, features: ["vista mar"] },
      { neighborhood: "Boa Viagem", price: 1_000_000, bedrooms: 3, features: ["vista mar"] },
    ];
    const suggestions = inferPreferenceSuggestions(samples, { desiredNeighborhoods: ["Boa Viagem"], desiredFeatures: ["vista mar"] });
    expect(suggestions).toEqual([]);
  });

  it("um único sinal isolado (1 amostra num universo de muitas) não vira sugestão por ruído", () => {
    const samples: PreferenceSignalSample[] = [
      { neighborhood: "Boa Viagem", price: 1_000_000, bedrooms: 3, features: [] },
      { neighborhood: "Casa Forte", price: 1_000_000, bedrooms: 3, features: [] },
      { neighborhood: "Espinheiro", price: 1_000_000, bedrooms: 3, features: [] },
      { neighborhood: "Graças", price: 1_000_000, bedrooms: 3, features: [] },
      { neighborhood: "Madalena", price: 1_000_000, bedrooms: 3, features: [] },
    ];
    expect(inferPreferenceSuggestions(samples, { desiredNeighborhoods: [], desiredFeatures: [] })).toEqual([]);
  });
});
