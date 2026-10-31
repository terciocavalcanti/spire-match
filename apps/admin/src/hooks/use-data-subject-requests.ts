"use client";

import type { ResolveDataSubjectRequestRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["data-subject-requests"] as const;

export function useDataSubjectRequests() {
  return useQuery({ queryKey: KEY, queryFn: () => apiClient.dataSubjectRequests.list() });
}

export function useResolveDataSubjectRequest(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ResolveDataSubjectRequestRequest) => apiClient.dataSubjectRequests.resolve(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
