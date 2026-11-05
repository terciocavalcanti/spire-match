"use client";

import type { CreateIntegrationConnectionRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["integration-connections"] as const;

export function useIntegrationConnections() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiClient.integrationConnections.list(),
  });
}

export function useCreateIntegrationConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIntegrationConnectionRequest) => apiClient.integrationConnections.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useActivateIntegrationConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.integrationConnections.activate(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function usePauseIntegrationConnection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.integrationConnections.pause(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRetryFailedIntegrationEvents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.integrationConnections.retryFailedEvents(),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
