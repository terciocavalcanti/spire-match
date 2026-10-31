"use client";

import type { AuditLogListQuery } from "@spire/contracts";
import { useInfiniteQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useAuditLogs(filters: Omit<Partial<AuditLogListQuery>, "cursor" | "limit"> = {}) {
  return useInfiniteQuery({
    queryKey: ["audit-logs", filters],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) => apiClient.auditLogs.list({ ...filters, cursor: pageParam, limit: 30 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}
