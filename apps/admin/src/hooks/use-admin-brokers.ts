"use client";

import type { CreateBrokerRequest, UpdateBrokerRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useBrokers() {
  return useQuery({ queryKey: ["brokers"], queryFn: () => apiClient.brokers.list() });
}

export function useCreateBroker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBrokerRequest) => apiClient.brokers.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["brokers"] }),
  });
}

export function useUpdateBroker(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateBrokerRequest) => apiClient.brokers.update(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["brokers"] }),
  });
}
