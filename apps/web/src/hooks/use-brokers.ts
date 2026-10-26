"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useBrokerForProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["broker", "by-property", propertyId],
    queryFn: () => apiClient.brokers.byProperty(propertyId!),
    enabled: Boolean(propertyId),
  });
}
