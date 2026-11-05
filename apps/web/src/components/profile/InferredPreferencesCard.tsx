"use client";

import type { InferredPreferenceSuggestion } from "@spire/contracts";
import { Button, Card } from "@spire/ui-web";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";

import { apiClient } from "@/lib/api-client";

const TYPE_LABEL: Record<InferredPreferenceSuggestion["type"], string> = {
  NEIGHBORHOOD: "bairro",
  FEATURE: "característica",
};

function suggestionKey(s: InferredPreferenceSuggestion): string {
  return `${s.type}:${s.value}`;
}

/**
 * Hipóteses de preferência inferidas do comportamento real (LIKE/FAVORITE),
 * nunca escritas automaticamente no perfil — só o botão "Confirmar" grava,
 * reaproveitando o mesmo `PUT /me/preferences` do formulário manual (M3,
 * ver docs/product/NOVOS_RECURSOS_PROGRESSO.md).
 */
export function InferredPreferencesCard() {
  const queryClient = useQueryClient();
  const { data: suggestionsData } = useQuery({
    queryKey: ["preferences", "suggestions"],
    queryFn: () => apiClient.preferences.suggestions(),
  });
  const { data: preferences } = useQuery({
    queryKey: ["preferences"],
    queryFn: () => apiClient.preferences.get(),
  });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const confirmMutation = useMutation({
    mutationFn: (suggestion: InferredPreferenceSuggestion) => {
      if (!preferences) throw new Error("Preferências ainda não carregaram");
      const payload =
        suggestion.type === "NEIGHBORHOOD"
          ? { desiredNeighborhoods: [...preferences.desiredNeighborhoods, suggestion.value] }
          : { desiredFeatures: [...preferences.desiredFeatures, suggestion.value] };
      return apiClient.preferences.update(payload);
    },
    onSuccess: (updated, suggestion) => {
      queryClient.setQueryData(["preferences"], updated);
      void queryClient.invalidateQueries({ queryKey: ["preferences", "suggestions"] });
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      setDismissed((prev) => new Set(prev).add(suggestionKey(suggestion)));
    },
  });

  const visibleSuggestions = (suggestionsData?.items ?? []).filter((s) => !dismissed.has(suggestionKey(s)));
  if (!preferences || visibleSuggestions.length === 0) return null;

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-brand-olive" aria-hidden />
        <h3 className="text-bodyMd font-medium text-ink-primary">Baseado no que você curtiu</h3>
      </div>
      <p className="mt-1 text-bodySm text-ink-secondary">
        Percebemos um padrão nos imóveis que você curtiu ou favoritou — confirme se faz sentido adicionar ao seu perfil.
      </p>
      <div className="mt-3 space-y-2">
        {visibleSuggestions.map((suggestion) => (
          <div key={suggestionKey(suggestion)} className="flex items-center justify-between gap-3 rounded-xl bg-background-subtle px-3 py-2">
            <p className="text-bodySm text-ink-primary">
              {suggestion.type === "NEIGHBORHOOD" ? "Bairro " : "Característica "}
              <strong>{suggestion.value}</strong> — presente em {suggestion.sampleCount} imóveis que você curtiu
            </p>
            <div className="flex shrink-0 items-center gap-1.5">
              <Button size="sm" disabled={confirmMutation.isPending} onClick={() => confirmMutation.mutate(suggestion)}>
                Confirmar
              </Button>
              <button
                type="button"
                aria-label={`Dispensar sugestão de ${TYPE_LABEL[suggestion.type]} ${suggestion.value}`}
                onClick={() => setDismissed((prev) => new Set(prev).add(suggestionKey(suggestion)))}
                className="flex h-9 w-9 items-center justify-center rounded-pill text-ink-tertiary hover:bg-background-elevated"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
