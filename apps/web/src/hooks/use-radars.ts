"use client";

import type { CreateRadarRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const RADARS_QUERY_KEY = ["radars"] as const;

export function useRadars() {
  return useQuery({ queryKey: RADARS_QUERY_KEY, queryFn: () => apiClient.radars.list() });
}

export function useCreateRadar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRadarRequest) => apiClient.radars.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RADARS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCheckRadar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.radars.check(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RADARS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useRemoveRadar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.radars.remove(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: RADARS_QUERY_KEY }),
  });
}
