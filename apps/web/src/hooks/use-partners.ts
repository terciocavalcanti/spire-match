"use client";

import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function usePartners() {
  return useQuery({
    queryKey: ["partners", "public"],
    queryFn: () => apiClient.partners.listPublic(),
  });
}
