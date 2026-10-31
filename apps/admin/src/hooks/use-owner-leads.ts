"use client";

import type {
  AssignOwnerLeadRequest,
  CreateOwnerLeadNoteRequest,
  OwnerLeadListQuery,
  PublishOwnerLeadRequest,
  UpdateOwnerLeadStageRequest,
} from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["owner-leads"] as const;

export function useOwnerLeads(query: Partial<OwnerLeadListQuery> = {}) {
  return useQuery({
    queryKey: [...KEY, query],
    queryFn: () => apiClient.ownerLeads.list(query),
  });
}

export function useOwnerLeadDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["owner-lead-detail", id],
    queryFn: () => apiClient.ownerLeads.detail(id!),
    enabled: Boolean(id),
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>, id: string) {
  void queryClient.invalidateQueries({ queryKey: KEY });
  void queryClient.invalidateQueries({ queryKey: ["owner-lead-detail", id] });
}

export function useUpdateOwnerLeadStage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOwnerLeadStageRequest) => apiClient.ownerLeads.updateStage(id, payload),
    onSuccess: () => invalidateAll(queryClient, id),
  });
}

export function useAssignOwnerLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignOwnerLeadRequest) => apiClient.ownerLeads.assign(id, payload),
    onSuccess: () => invalidateAll(queryClient, id),
  });
}

export function useAddOwnerLeadNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOwnerLeadNoteRequest) => apiClient.ownerLeads.addNote(id, payload),
    onSuccess: () => invalidateAll(queryClient, id),
  });
}

export function usePublishOwnerLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PublishOwnerLeadRequest = {}) => apiClient.ownerLeads.publish(id, payload),
    onSuccess: () => invalidateAll(queryClient, id),
  });
}
