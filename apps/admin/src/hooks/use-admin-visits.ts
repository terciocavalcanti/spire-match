"use client";

import type { AdminVisitListQuery } from "@spire/contracts";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useAdminAgenda(query: Partial<AdminVisitListQuery> = {}) {
  return useQuery({ queryKey: ["admin-agenda", query], queryFn: () => apiClient.adminVisits.agenda(query) });
}
