"use client";

import type { CreateContactRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const CONTACTS_QUERY_KEY = ["contacts", "mine"] as const;

export function useMyContacts() {
  return useQuery({ queryKey: CONTACTS_QUERY_KEY, queryFn: () => apiClient.contacts.mine() });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContactRequest) => apiClient.contacts.create(payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: CONTACTS_QUERY_KEY }),
  });
}
