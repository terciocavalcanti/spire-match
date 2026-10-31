"use client";

import type { VerifyPrivateMarketOfferRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function usePrivateMarketOfferByOwnerLead(ownerLeadId: string | undefined) {
  return useQuery({
    queryKey: ["private-market-offer", ownerLeadId],
    queryFn: () => apiClient.privateMarket.byOwnerLeadId(ownerLeadId!),
    enabled: Boolean(ownerLeadId),
  });
}

export function useVerifyPrivateMarketOffer(offerId: string | undefined, ownerLeadId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyPrivateMarketOfferRequest) => apiClient.privateMarket.verify(offerId!, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["private-market-offer", ownerLeadId] }),
  });
}
