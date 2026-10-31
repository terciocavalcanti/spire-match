"use client";

import type { GrantDevelopmentPartnerAccessRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["development-partner-access"] as const;

export function useDevelopmentPartnerAccessList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiClient.developmentPartnerAccess.list(),
  });
}

export function useMyDevelopmentPartnerAccess() {
  return useQuery({
    queryKey: ["my-development-partner-access"],
    queryFn: () => apiClient.developmentPartnerAccess.mine(),
  });
}

export function useGrantDevelopmentPartnerAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GrantDevelopmentPartnerAccessRequest) => apiClient.developmentPartnerAccess.grant(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRevokeDevelopmentPartnerAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.developmentPartnerAccess.revoke(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
