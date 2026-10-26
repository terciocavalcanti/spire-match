import { describe, expect, it } from "vitest";

import { buildNearestNeighborRoute } from "./route";

describe("buildNearestNeighborRoute", () => {
  it("retorna vazio para lista vazia", () => {
    expect(buildNearestNeighborRoute([])).toEqual({ stops: [], totalDistanceMeters: 0 });
  });

  it("ordena por vizinho mais próximo a partir do primeiro item", () => {
    // A -> C é bem mais perto que A -> B; a rota gulosa deve visitar C antes de B.
    const route = buildNearestNeighborRoute([
      { id: "A", location: { lat: -8.12, lng: -34.9 } },
      { id: "B", location: { lat: -8.3, lng: -35.1 } }, // longe
      { id: "C", location: { lat: -8.121, lng: -34.901 } }, // bem perto de A
    ]);

    expect(route.stops.map((s) => s.id)).toEqual(["A", "C", "B"]);
    expect(route.stops[0]?.distanceFromPreviousMeters).toBeNull();
    expect(route.stops[1]?.distanceFromPreviousMeters).toBeLessThan(1000);
    expect(route.totalDistanceMeters).toBeGreaterThan(0);
  });

  it("mantém a única parada quando só há um imóvel", () => {
    const route = buildNearestNeighborRoute([{ id: "A", location: { lat: -8.12, lng: -34.9 } }]);
    expect(route.stops).toHaveLength(1);
    expect(route.totalDistanceMeters).toBe(0);
  });
});
