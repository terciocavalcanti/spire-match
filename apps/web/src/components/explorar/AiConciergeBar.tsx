"use client";

import type { AiSearchResponse } from "@spire/contracts";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";

import { apiClient } from "@/lib/api-client";

export interface AiConciergeBarProps {
  onResult: (result: AiSearchResponse | null) => void;
}

/**
 * Entrada do AI Concierge (seção 4.10). Sem provedor de LLM configurado, a
 * API usa um parser determinístico — a interface não promete nada além
 * disso; o rótulo "busca inteligente" reflete compreensão de linguagem
 * estruturada, não um chat livre.
 */
export function AiConciergeBar({ onResult }: AiConciergeBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [explanation, setExplanation] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => apiClient.aiSearch.search({ query }),
    onSuccess: (result) => {
      setExplanation(result.explanation);
      onResult(result);
    },
  });

  function clear() {
    setQuery("");
    setExplanation(null);
    onResult(null);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 flex w-full items-center gap-2 rounded-xl border border-dashed border-border-strong bg-background-elevated px-4 py-3 text-left text-bodySm text-ink-secondary"
      >
        <Sparkles className="h-4 w-4 text-brand-olive" />
        Descreva o imóvel que procura em suas palavras
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-border-subtle bg-background-elevated p-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) mutation.mutate();
        }}
        className="flex items-center gap-2"
      >
        <Sparkles className="h-4 w-4 shrink-0 text-brand-olive" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex.: apartamento com 3 quartos em Boa Viagem até R$ 1,3 milhão"
          className="h-9 flex-1 bg-transparent text-bodySm text-ink-primary placeholder:text-ink-tertiary focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            clear();
          }}
          aria-label="Fechar busca inteligente"
          className="text-ink-tertiary"
        >
          <X className="h-4 w-4" />
        </button>
      </form>

      {mutation.isPending && <p className="mt-2 text-caption text-ink-tertiary">Analisando seu pedido…</p>}
      {explanation && !mutation.isPending && (
        <div className="mt-2 flex items-start justify-between gap-2 rounded-lg bg-background-subtle px-3 py-2">
          <p className="text-bodySm text-ink-secondary">{explanation}</p>
          <button type="button" onClick={clear} className="shrink-0 text-caption font-medium text-ink-primary underline">
            Limpar
          </button>
        </div>
      )}
    </div>
  );
}
