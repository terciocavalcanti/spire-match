"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const FAVORITES_QUERY_KEY = ["favorites"] as const;

export function useFavorites() {
  return useQuery({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: () => apiClient.favorites.list(),
    retry: false,
  });
}

/** Deriva o conjunto de IDs favoritados para toggles rápidos em cards de lista. */
export function useFavoriteIds() {
  const { data } = useFavorites();
  return new Set((data?.items ?? []).map((f) => f.propertyId));
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ propertyId, isFavorite }: { propertyId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await apiClient.favorites.remove(propertyId);
      } else {
        await apiClient.favorites.add({ propertyId });
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });
}
