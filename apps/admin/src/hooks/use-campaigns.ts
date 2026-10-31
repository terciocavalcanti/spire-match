"use client";

import type { CampaignListQuery, CreateCampaignRequest, UpdateCampaignRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["campaigns"] as const;

export function useCampaigns(query: Partial<CampaignListQuery> = {}) {
  return useQuery({
    queryKey: [...KEY, query],
    queryFn: () => apiClient.campaigns.list(query),
  });
}

export function useCampaignDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["campaign-detail", id],
    queryFn: () => apiClient.campaigns.detail(id!),
    enabled: Boolean(id),
  });
}

export function useCampaignStats(id: string | undefined) {
  return useQuery({
    queryKey: ["campaign-stats", id],
    queryFn: () => apiClient.campaigns.stats(id!),
    enabled: Boolean(id),
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCampaignRequest) => apiClient.campaigns.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCampaign(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCampaignRequest) => apiClient.campaigns.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["campaign-detail", id] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.campaigns.delete(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
