"use client";

import type { CreateProposalRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const PROPOSALS_QUERY_KEY = ["proposals", "mine"] as const;

export function useMyProposals() {
  return useQuery({ queryKey: PROPOSALS_QUERY_KEY, queryFn: () => apiClient.proposals.mine() });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProposalRequest) => apiClient.proposals.create(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROPOSALS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
