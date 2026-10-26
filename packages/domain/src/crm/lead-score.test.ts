import { describe, expect, it } from "vitest";

import { computeLeadScore, temperatureFromScore } from "./lead-score";

describe("computeLeadScore", () => {
  it("lead sem nenhum sinal fica frio com score 0", () => {
    const result = computeLeadScore({ viewsCount: 0, favoritesCount: 0, hasContact: false, hasScheduledVisit: false, hasProposal: false });
    expect(result.score).toBe(0);
    expect(result.temperature).toBe("FRIO");
  });

  it("proposta sozinha ja classifica como morno", () => {
    const result = computeLeadScore({ viewsCount: 0, favoritesCount: 0, hasContact: false, hasScheduledVisit: false, hasProposal: true });
    expect(result.score).toBe(35);
    expect(result.temperature).toBe("MORNO");
  });

  it("contato + visita + proposta classifica como quente e satura em 100", () => {
    const result = computeLeadScore({ viewsCount: 20, favoritesCount: 20, hasContact: true, hasScheduledVisit: true, hasProposal: true });
    expect(result.score).toBe(100);
    expect(result.temperature).toBe("QUENTE");
  });

  it("views e favoritos sao limitados a 10 pontos cada", () => {
    const result = computeLeadScore({ viewsCount: 999, favoritesCount: 999, hasContact: false, hasScheduledVisit: false, hasProposal: false });
    expect(result.score).toBe(20);
  });
});

describe("temperatureFromScore", () => {
  it("usa os mesmos limiares de computeLeadScore", () => {
    expect(temperatureFromScore(0)).toBe("FRIO");
    expect(temperatureFromScore(29)).toBe("FRIO");
    expect(temperatureFromScore(30)).toBe("MORNO");
    expect(temperatureFromScore(59)).toBe("MORNO");
    expect(temperatureFromScore(60)).toBe("QUENTE");
    expect(temperatureFromScore(100)).toBe("QUENTE");
  });
});
