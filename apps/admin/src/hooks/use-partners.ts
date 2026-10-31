"use client";

import type { CreatePartnerRequest, UpdatePartnerRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["admin-partners"] as const;

export function useAdminPartners() {
  return useQuery({ queryKey: KEY, queryFn: () => apiClient.partners.list() });
}

export function useCreatePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePartnerRequest) => apiClient.partners.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePartner(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePartnerRequest) => apiClient.partners.update(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.partners.delete(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
