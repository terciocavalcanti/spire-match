import { describe, expect, it } from "vitest";

import { parseSearchQuery } from "./parse-query";

const NEIGHBORHOODS = ["Boa Viagem", "Pina", "Setúbal", "Casa Forte"];

describe("parseSearchQuery", () => {
  it("interpreta o exemplo do prompt mestre", () => {
    const result = parseSearchQuery(
      "quero apartamento com 3 quartos em Boa Viagem até R$ 1,3 milhão",
      NEIGHBORHOODS,
    );
    expect(result.type).toBe("APARTAMENTO");
    expect(result.bedroomsMin).toBe(3);
    expect(result.neighborhoods).toEqual(["Boa Viagem"]);
    expect(result.priceMax).toBe(1_300_000);
  });

  it("reconhece faixa de preço explícita (entre X e Y)", () => {
    const result = parseSearchQuery("casa entre R$ 800.000 e R$ 1.500.000 em Setúbal", NEIGHBORHOODS);
    expect(result.priceMin).toBe(800_000);
    expect(result.priceMax).toBe(1_500_000);
    expect(result.type).toBe("CASA");
  });

  it("reconhece 'mil' como multiplicador", () => {
    const result = parseSearchQuery("cobertura até 600 mil", NEIGHBORHOODS);
    expect(result.priceMax).toBe(600_000);
    expect(result.type).toBe("COBERTURA");
  });

  it("reconhece finalidade de investimento", () => {
    const result = parseSearchQuery("apartamento para investir na Pina", NEIGHBORHOODS);
    expect(result.purpose).toBe("INVESTIR");
    expect(result.neighborhoods).toEqual(["Pina"]);
  });

  it("não confunde número de quartos com valor monetário", () => {
    const result = parseSearchQuery("apartamento com 4 quartos", NEIGHBORHOODS);
    expect(result.bedroomsMin).toBe(4);
    expect(result.priceMax).toBeUndefined();
  });

  it("retorna campos vazios para texto sem sinais reconhecíveis", () => {
    const result = parseSearchQuery("algo bacana para morar", NEIGHBORHOODS);
    expect(result.purpose).toBe("MORAR");
    expect(result.neighborhoods).toEqual([]);
    expect(result.type).toBeUndefined();
    expect(result.priceMax).toBeUndefined();
  });
});
