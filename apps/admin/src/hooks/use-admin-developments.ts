"use client";

import type {
  AdminDevelopmentListQuery,
  CreateDevelopmentBlockRequest,
  CreateDevelopmentRequest,
  UpdateDevelopmentRequest,
} from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["admin-developments"] as const;

export function useAdminDevelopments(query: Partial<AdminDevelopmentListQuery> = {}) {
  return useQuery({
    queryKey: [...KEY, query],
    queryFn: () => apiClient.developments.list(query),
  });
}

export function useDevelopmentDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["development-detail", id],
    queryFn: () => apiClient.developments.detail(id!),
    enabled: Boolean(id),
  });
}

export function useCreateDevelopment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDevelopmentRequest) => apiClient.developments.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateDevelopment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateDevelopmentRequest) => apiClient.developments.update(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KEY });
      void queryClient.invalidateQueries({ queryKey: ["development-detail", id] });
    },
  });
}

export function useAddDevelopmentBlock(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateDevelopmentBlockRequest) => apiClient.developments.addBlock(id, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["development-detail", id] }),
  });
}

export function useRemoveDevelopmentBlock(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) => apiClient.developments.removeBlock(id, blockId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["development-detail", id] }),
  });
}
