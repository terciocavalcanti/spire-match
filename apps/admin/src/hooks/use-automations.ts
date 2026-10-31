"use client";

import type { AutomationType, UpdateAutomationRuleRequest } from "@spire/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

const KEY = ["automations"] as const;

export function useAutomations() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => apiClient.automations.list(),
  });
}

export function useUpdateAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, payload }: { type: AutomationType; payload: UpdateAutomationRuleRequest }) =>
      apiClient.automations.update(type, payload),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRunAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (type: AutomationType) => apiClient.automations.run(type),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
