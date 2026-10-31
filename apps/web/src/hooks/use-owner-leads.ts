"use client";

import type { CreateOwnerLeadRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useMyOwnerLeads() {
  return useQuery({
    queryKey: ["owner-leads", "mine"],
    queryFn: () => apiClient.ownerLeads.mine(),
  });
}

export function useCreateOwnerLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOwnerLeadRequest) => apiClient.ownerLeads.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["owner-leads"] }),
  });
}
