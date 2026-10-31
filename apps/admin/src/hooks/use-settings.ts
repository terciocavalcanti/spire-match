"use client";

import type { UpdateCommissionRateRequest, UpdateMatchWeightsRequest, UpdateRadarSweepIntervalRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["platform-settings"] as const;

export function usePlatformSettings() {
  return useQuery({ queryKey: KEY, queryFn: () => apiClient.settings.get() });
}

export function useUpdateMatchWeights() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMatchWeightsRequest) => apiClient.settings.updateMatchWeights(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCommissionRate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCommissionRateRequest) => apiClient.settings.updateCommissionRate(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateRadarSweepInterval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRadarSweepIntervalRequest) => apiClient.settings.updateRadarSweepInterval(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
