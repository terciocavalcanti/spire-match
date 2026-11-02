"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

/**
 * A chave do Geoapify é lida em runtime via API (GET /map-config), não mais
 * de NEXT_PUBLIC_GEOAPIFY_API_KEY embutida no build — o Coolify não propaga
 * de forma confiável variáveis usadas só em "build.args" do docker-compose
 * (coollabsio/coolify#5612). O valor não muda em runtime, por isso staleTime
 * longo e sem refetch automático.
 */
export function useMapConfig() {
  return useQuery({
    queryKey: ["map-config"],
    queryFn: () => apiClient.mapConfig.get(),
    staleTime: 60 * 60_000,
    gcTime: 60 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
