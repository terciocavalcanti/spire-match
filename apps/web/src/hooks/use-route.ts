"use client";

import { useQuery } from "@tanstack/react-query";

export interface RouteResult {
  /** [lat, lng] — já convertido da ordem [lng, lat] do GeoJSON para o padrão Leaflet. */
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Roteirização de carro via servidor de demonstração público do OSRM
 * (router.project-osrm.org) — sem chave, mas é um serviço de demonstração:
 * mesmo trade-off de uso pesado/comercial já documentado para o tile server
 * bruto do OpenStreetMap (ver PropertyMap.tsx). Caminho de upgrade real sem
 * mudar a forma da resposta: trocar OSRM_URL abaixo por uma conta própria
 * (ex. OpenRouteService, GraphHopper) com chave.
 */
const OSRM_URL = "https://router.project-osrm.org/route/v1/driving";

export function useRoute(
  origin: { lat: number; lng: number } | null | undefined,
  destination: { lat: number; lng: number } | null | undefined,
) {
  return useQuery({
    queryKey: ["route", origin?.lat, origin?.lng, destination?.lat, destination?.lng],
    queryFn: async (): Promise<RouteResult | null> => {
      const coords = `${origin!.lng},${origin!.lat};${destination!.lng},${destination!.lat}`;
      const res = await fetch(`${OSRM_URL}/${coords}?overview=full&geometries=geojson`);
      if (!res.ok) throw new Error(`Falha ao calcular rota (status ${res.status})`);
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) return null;
      return {
        coordinates: route.geometry.coordinates.map(([lng, lat]: [number, number]): [number, number] => [lat, lng]),
        distanceMeters: route.distance,
        durationSeconds: route.duration,
      };
    },
    enabled: Boolean(origin && destination),
    retry: false,
    staleTime: 60_000,
  });
}
