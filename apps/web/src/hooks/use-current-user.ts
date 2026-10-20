"use client";

import { SpireApiError } from "@spire/api-client";
import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export const CURRENT_USER_QUERY_KEY = ["me"] as const;

/** Retorna `null` quando o visitante não está autenticado (estado legítimo, não erro). */
export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: async () => {
      try {
        return await apiClient.me.get();
      } catch (error) {
        if (error instanceof SpireApiError && error.statusCode === 401) {
          return null;
        }
        throw error;
      }
    },
  });
}
