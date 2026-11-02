"use client";

import { useQuery } from "@tanstack/react-query";

import { useMapConfig } from "./use-map-config";

export interface NearbyCategoryResult {
  categoryKey: string;
  label: string;
  /** null = nenhum lugar dessa categoria encontrado no raio de busca — mostrado como zero honesto, nunca omitido. */
  place: { name: string; distanceMeters: number } | null;
}

const PLACES_URL = "https://api.geoapify.com/v2/places";
const SEARCH_RADIUS_METERS = 2000;

/** Categorias reais da Geoapify Places API — ver https://apidocs.geoapify.com/docs/places/#categories */
const CATEGORIES: { key: string; label: string; fallbackName: string }[] = [
  { key: "commercial.supermarket", label: "Mercado", fallbackName: "Mercado próximo" },
  { key: "healthcare.pharmacy", label: "Farmácia", fallbackName: "Farmácia próxima" },
  { key: "education.school", label: "Escola", fallbackName: "Escola próxima" },
  { key: "catering.restaurant", label: "Restaurante", fallbackName: "Restaurante próximo" },
  { key: "sport.fitness", label: "Academia", fallbackName: "Academia próxima" },
  { key: "leisure.park", label: "Parque", fallbackName: "Parque próximo" },
];

async function fetchNearest(
  categoryKey: string,
  fallbackName: string,
  lat: number,
  lng: number,
  geoapifyKey: string,
): Promise<{ name: string; distanceMeters: number } | null> {
  const url = `${PLACES_URL}?categories=${categoryKey}&filter=circle:${lng},${lat},${SEARCH_RADIUS_METERS}&bias=proximity:${lng},${lat}&limit=1&apiKey=${geoapifyKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao buscar ${categoryKey} (status ${res.status})`);
  const data = await res.json();
  const feature = data.features?.[0];
  if (!feature) return null;
  // Nem todo ponto do OpenStreetMap tem nome cadastrado — mostrar o
  // endereço cru nesse caso parece um nome de estabelecimento por engano;
  // um rótulo genérico é mais honesto que inventar ou confundir.
  const name: string = feature.properties.name ?? fallbackName;
  return { name, distanceMeters: feature.properties.distance };
}

/**
 * City/Life real: a categoria mais próxima de cada tipo de serviço/comodidade
 * em até SEARCH_RADIUS_METERS do imóvel, via Geoapify Places API (conta real,
 * mesma chave do Routing). A chave vem de useMapConfig (runtime via API), não
 * de build-time. Uma categoria sem resultado no raio aparece como zero
 * honesto (`place: null`), nunca é omitida silenciosamente nem preenchida
 * com dado inventado.
 */
export function useNearbyPlaces(location: { lat: number; lng: number } | null | undefined) {
  const mapConfig = useMapConfig();
  const geoapifyKey = mapConfig.data?.geoapifyApiKey;

  return useQuery({
    queryKey: ["nearby-places", location?.lat, location?.lng, geoapifyKey],
    queryFn: async (): Promise<NearbyCategoryResult[]> => {
      const { lat, lng } = location!;
      return Promise.all(
        CATEGORIES.map(async ({ key, label, fallbackName }) => ({
          categoryKey: key,
          label,
          place: await fetchNearest(key, fallbackName, lat, lng, geoapifyKey!),
        })),
      );
    },
    enabled: Boolean(location && geoapifyKey),
    staleTime: 10 * 60_000,
    retry: false,
  });
}
