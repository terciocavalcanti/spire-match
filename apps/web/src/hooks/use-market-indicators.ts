"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useMarketIndicators() {
  return useQuery({
    queryKey: ["market-indicators", "public"],
    queryFn: () => apiClient.marketIndicators.listPublic(),
  });
}
