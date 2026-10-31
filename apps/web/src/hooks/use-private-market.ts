"use client";

import type { PrivateMarketOfferListQuery, RequestPrivateMarketContactRequest } from "@spire/contracts";
import { useMutation, useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function usePrivateMarketOffers(query: Partial<PrivateMarketOfferListQuery> = {}) {
  return useQuery({
    queryKey: ["private-market", query],
    queryFn: () => apiClient.privateMarket.list(query),
  });
}

export function useRequestPrivateMarketContact(offerId: string) {
  return useMutation({
    mutationFn: (payload: RequestPrivateMarketContactRequest = { message: "" }) => apiClient.privateMarket.requestContact(offerId, payload),
  });
}
