"use client";

import type { CreateVisitRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const VISITS_QUERY_KEY = ["visits", "mine"] as const;

export function useMyVisits() {
  return useQuery({ queryKey: VISITS_QUERY_KEY, queryFn: () => apiClient.visits.mine() });
}

export function useVisitAvailability(brokerId: string | undefined, date: string | undefined) {
  return useQuery({
    queryKey: ["visits", "availability", brokerId, date],
    queryFn: () => apiClient.visits.availability(brokerId!, date!),
    enabled: Boolean(brokerId && date),
  });
}

export function useScheduleVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVisitRequest) => apiClient.visits.schedule(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VISITS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useCancelVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.visits.cancel(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: VISITS_QUERY_KEY }),
  });
}
