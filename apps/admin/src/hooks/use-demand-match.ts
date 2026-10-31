"use client";

import type { DemandMatchQuery } from "@spire/contracts";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useDemandMatch(query: DemandMatchQuery) {
  return useQuery({
    queryKey: ["demand-match", query],
    queryFn: () => apiClient.demandMatch.get(query),
  });
}
