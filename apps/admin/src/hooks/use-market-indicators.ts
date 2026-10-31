"use client";

import type { CreateMarketIndicatorRequest, UpdateMarketIndicatorRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["market-indicators"] as const;

export function useMarketIndicators() {
  return useQuery({ queryKey: KEY, queryFn: () => apiClient.marketIndicators.list() });
}

export function useCreateMarketIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMarketIndicatorRequest) => apiClient.marketIndicators.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateMarketIndicator(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateMarketIndicatorRequest) => apiClient.marketIndicators.update(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteMarketIndicator() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.marketIndicators.delete(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
