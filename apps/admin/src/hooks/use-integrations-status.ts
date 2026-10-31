"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useIntegrationsStatus() {
  return useQuery({
    queryKey: ["integrations-status"],
    queryFn: () => apiClient.integrationsStatus.list(),
  });
}
