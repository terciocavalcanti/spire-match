"use client";

import { useQuery } from "@tanstack/react-query";

export interface RouteResult {
  /** [lat, lng] — já convertido da ordem [lng, lat] do GeoJSON para o padrão Leaflet. */
  coordinates: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Roteirização de carro via Geoapify Routing API (mesma chave do Places/City-Life
 * e do MapTiler para tiles — contas reais, nunca um servidor de demonstração
 * público). Precisa de NEXT_PUBLIC_GEOAPIFY_API_KEY configurada.
 */
const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;
const ROUTING_URL = "https://api.geoapify.com/v1/routing";

// Arredonda a ~100m de precisão só para decidir SE recalcula a rota — o GPS
// real (watchPosition com enableHighAccuracy) varia a cada leitura mesmo
// parado (ruído de sensor), e usar a coordenada crua na chave da query
// disparava um recálculo de rota a cada tick do GPS: o mapa nunca parava de
// recentralizar (fitBounds em PropertyMap.tsx reage a cada novo resultado),
// dando a impressão de "piscando" e de zoom manual sendo desfeito sozinho.
function roundForQueryKey(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function useRoute(
  origin: { lat: number; lng: number } | null | undefined,
  destination: { lat: number; lng: number } | null | undefined,
) {
  return useQuery({
    queryKey: [
      "route",
      origin ? roundForQueryKey(origin.lat) : undefined,
      origin ? roundForQueryKey(origin.lng) : undefined,
      destination?.lat,
      destination?.lng,
    ],
    queryFn: async (): Promise<RouteResult | null> => {
      if (!GEOAPIFY_KEY) throw new Error("NEXT_PUBLIC_GEOAPIFY_API_KEY não configurada");
      const waypoints = `${origin!.lat},${origin!.lng}|${destination!.lat},${destination!.lng}`;
      const res = await fetch(`${ROUTING_URL}?waypoints=${waypoints}&mode=drive&apiKey=${GEOAPIFY_KEY}`);
      if (!res.ok) throw new Error(`Falha ao calcular rota (status ${res.status})`);
      const data = await res.json();
      const feature = data.features?.[0];
      if (!feature) return null;
      // geometry vem como MultiLineString (um ou mais segmentos) — achata
      // num único traçado contínuo, suficiente para desenhar a polyline.
      const segments: [number, number][][] = feature.geometry.coordinates;
      const coordinates: [number, number][] = segments.flat().map(([lng, lat]) => [lat, lng]);
      return {
        coordinates,
        distanceMeters: feature.properties.distance,
        durationSeconds: feature.properties.time,
      };
    },
    enabled: Boolean(origin && destination && GEOAPIFY_KEY),
    retry: false,
    staleTime: 60_000,
  });
}
