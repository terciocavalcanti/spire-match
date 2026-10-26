import { haversineDistanceMeters } from "../match/geo";
import type { GeoPoint } from "../match/types";

export interface TourCandidate {
  id: string;
  location: GeoPoint;
}

export interface TourRouteStop {
  id: string;
  order: number;
  distanceFromPreviousMeters: number | null;
}

export interface TourRoute {
  stops: TourRouteStop[];
  totalDistanceMeters: number;
}

/**
 * Ordena um pequeno conjunto de imóveis (2–5, ver `generateTourRequestSchema`)
 * num roteiro de visita por vizinho mais próximo (nearest neighbor) a partir
 * do primeiro item da lista — heurística gulosa, não o TSP ótimo, mas
 * suficiente e previsível para o volume desta tela (poucas paradas). Toda
 * distância vem de `haversineDistanceMeters`, nunca estimada/inventada.
 */
export function buildNearestNeighborRoute(candidates: TourCandidate[]): TourRoute {
  if (candidates.length === 0) return { stops: [], totalDistanceMeters: 0 };

  const remaining = [...candidates];
  const stops: TourRouteStop[] = [];
  let totalDistanceMeters = 0;

  let current = remaining.shift();
  if (!current) return { stops: [], totalDistanceMeters: 0 };
  stops.push({ id: current.id, order: 0, distanceFromPreviousMeters: null });

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      if (!candidate) continue;
      const distance = haversineDistanceMeters(current.location, candidate.location);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }
    const [next] = remaining.splice(nearestIndex, 1);
    if (!next) break;
    totalDistanceMeters += nearestDistance;
    stops.push({ id: next.id, order: stops.length, distanceFromPreviousMeters: nearestDistance });
    current = next;
  }

  return { stops, totalDistanceMeters };
}
