"use client";

import type { CommissionListQuery, MarkCommissionReceivedRequest, ReportsQuery, VgvReportQuery } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useCommissions(query: Partial<CommissionListQuery> = {}) {
  return useQuery({
    queryKey: ["commissions", query],
    queryFn: () => apiClient.commissions.list(query),
  });
}

export function useCommissionsSummary(query: Partial<ReportsQuery> = {}) {
  return useQuery({
    queryKey: ["commissions-summary", query],
    queryFn: () => apiClient.commissions.summary(query),
  });
}

export function useMarkCommissionReceived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: MarkCommissionReceivedRequest }) => apiClient.commissions.markReceived(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["commissions"] });
      void queryClient.invalidateQueries({ queryKey: ["commissions-summary"] });
    },
  });
}

export function useVgvReport(query: Partial<VgvReportQuery> = {}) {
  return useQuery({
    queryKey: ["vgv-report", query],
    queryFn: () => apiClient.reports.vgv(query),
  });
}

export function useAttributionReport(query: Partial<ReportsQuery> = {}) {
  return useQuery({
    queryKey: ["attribution-report", query],
    queryFn: () => apiClient.reports.attribution(query),
  });
}
