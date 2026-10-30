"use client";

import type { AdminUnitListQuery, CreateUnitRequest, ImportUnitsRequest, UpdateUnitRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["admin-units"] as const;

export function useAdminUnits(query: Partial<AdminUnitListQuery> = {}) {
  return useQuery({
    queryKey: [...KEY, query],
    queryFn: () => apiClient.units.list(query),
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUnitRequest) => apiClient.units.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateUnit(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateUnitRequest) => apiClient.units.update(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useImportUnits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ImportUnitsRequest) => apiClient.units.import(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
