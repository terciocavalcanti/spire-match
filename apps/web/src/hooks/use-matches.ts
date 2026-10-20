"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useMatches(params: { limit?: number; lat?: number; lng?: number } = {}) {
  return useQuery({
    queryKey: ["matches", params],
    queryFn: () => apiClient.matches.list(params),
    enabled: true,
    retry: false,
  });
}

export function useMatchForProperty(propertyId: string | undefined, lat?: number, lng?: number) {
  return useQuery({
    queryKey: ["match", propertyId, lat, lng],
    queryFn: () => apiClient.matches.forProperty(propertyId!, { lat, lng }),
    enabled: Boolean(propertyId),
    retry: false,
  });
}
