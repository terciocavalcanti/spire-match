"use client";

import type { AdminPropertyListQuery, CreatePropertyRequest, UpdatePropertyRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useAdminProperties(query: Partial<AdminPropertyListQuery> = {}) {
  return useQuery({
    queryKey: ["admin-properties", query],
    queryFn: () => apiClient.adminProperties.list(query),
  });
}

export function usePropertyDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["property-detail", id],
    queryFn: () => apiClient.properties.byId(id!),
    enabled: Boolean(id),
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePropertyRequest) => apiClient.adminProperties.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["admin-properties"] }),
  });
}

export function useUpdateProperty(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdatePropertyRequest) => apiClient.adminProperties.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin-properties"] });
      // Sem isso, reabrir "Editar" no mesmo imóvel mostra os valores antigos
      // (cache de ["property-detail", id] nunca era invalidado) — parecia
      // que a edição não tinha sido salva, embora o PATCH já tivesse
      // persistido corretamente no banco.
      void queryClient.invalidateQueries({ queryKey: ["property-detail", id] });
    },
  });
}
