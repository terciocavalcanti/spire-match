"use client";

import type { CreateDataSubjectRequestRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["my-data-requests"] as const;

export function useMyDataRequests() {
  return useQuery({ queryKey: KEY, queryFn: () => apiClient.dataSubjectRequests.mine() });
}

export function useCreateDataRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDataSubjectRequestRequest) => apiClient.dataSubjectRequests.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
