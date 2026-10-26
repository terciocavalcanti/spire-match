"use client";

import type {
  AssignLeadRequest,
  CreateLeadNoteRequest,
  LeadListQuery,
  UpdateLeadStageRequest,
} from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

function invalidateLeadQueries(queryClient: ReturnType<typeof useQueryClient>, id?: string) {
  void queryClient.invalidateQueries({ queryKey: ["leads"] });
  if (id) void queryClient.invalidateQueries({ queryKey: ["lead", id] });
}

export function useLeads(query: Partial<LeadListQuery> = {}) {
  return useQuery({ queryKey: ["leads", query], queryFn: () => apiClient.leads.list(query) });
}

export function useLeadsOverview() {
  return useQuery({ queryKey: ["leads", "overview"], queryFn: () => apiClient.leads.overview() });
}

export function useFunnelReport(days = 30) {
  return useQuery({
    queryKey: ["leads", "funnel-report", days],
    queryFn: () => apiClient.leads.funnelReport(days),
  });
}

export function useLeadDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["lead", id],
    queryFn: () => apiClient.leads.detail(id!),
    enabled: Boolean(id),
  });
}

export function useUpdateLeadStage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLeadStageRequest) => apiClient.leads.updateStage(id, payload),
    onSuccess: () => invalidateLeadQueries(queryClient, id),
  });
}

export function useAssignLead(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AssignLeadRequest) => apiClient.leads.assign(id, payload),
    onSuccess: () => invalidateLeadQueries(queryClient, id),
  });
}

export function useAddLeadNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeadNoteRequest) => apiClient.leads.addNote(id, payload),
    onSuccess: () => invalidateLeadQueries(queryClient, id),
  });
}
