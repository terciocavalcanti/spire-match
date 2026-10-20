"use client";

import type { MatchResult } from "@spire/contracts";
import { EmptyState, MatchBadge } from "@spire/ui-web";
import { useQueryClient } from "@tanstack/react-query";
import { BedDouble, Car, Heart, MapPin, Ruler, Sparkles, X } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useMatches } from "@/hooks/use-matches";
import { apiClient } from "@/lib/api-client";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function SwipeCard({ match }: { match: MatchResult }) {
  const { property } = match;
  return (
    <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
      <div className="relative aspect-[4/3] w-full bg-background-subtle">
        {property.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={property.coverImageUrl} alt={property.title} className="h-full w-full object-cover" />
        )}
        <div className="absolute left-3 top-3">
          <MatchBadge score={match.score} size="lg" />
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-bodySm uppercase tracking-wide text-ink-tertiary">{property.type}</p>
        <p className="mt-1 font-display text-2xl text-ink-primary">{currencyFormatter.format(property.price)}</p>
        <p className="mt-1 flex items-center gap-1 text-bodyMd text-ink-secondary">
          <MapPin className="h-4 w-4" /> {property.neighborhood}
        </p>
        <div className="mt-3 flex items-center gap-4 text-bodyMd text-ink-secondary">
          <span className="flex items-center gap-1.5">
            <Ruler className="h-4 w-4" /> {property.areaSqm.toFixed(0)} m²
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" /> {property.bedrooms}
          </span>
          <span className="flex items-center gap-1.5">
            <Car className="h-4 w-4" /> {property.parkingSpaces}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DescobrirPage() {
  const { data, isLoading } = useMatches({ limit: 25 });
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [lastAction, setLastAction] = useState<{ match: MatchResult; index: number } | null>(null);

  const items = data?.items ?? [];
  const current = items[index];

  async function act(type: "DISLIKE" | "FAVORITE" | "LIKE") {
    if (!current) return;
    await apiClient.interactions.create({ propertyId: current.propertyId, type });
    if (type === "FAVORITE") {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    }
    setLastAction({ match: current, index });
    setIndex((i) => i + 1);
  }

  function undo() {
    if (!lastAction) return;
    setIndex(lastAction.index);
    setLastAction(null);
  }

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Descubra imóveis para você</h1>
        <p className="mt-1 text-bodyMd text-ink-secondary">Deslize para encontrar o seu próximo lar</p>

        {isLoading ? (
          <div className="mt-6 h-[28rem] animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : !current ? (
          <div className="mt-6">
            <EmptyState
              icon={<Sparkles className="h-8 w-8" aria-hidden />}
              title={items.length === 0 ? "Nenhum Match disponível" : "Você viu todos os Matches por agora"}
              description="Volte mais tarde — novos imóveis compatíveis aparecem aqui conforme a carteira é atualizada."
              action={
                lastAction ? (
                  <button type="button" onClick={undo} className="text-bodyMd font-semibold text-ink-primary underline">
                    Desfazer última ação
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <SwipeCard match={current} />
            </div>

            <div className="mt-6 flex items-center justify-center gap-6">
              <button
                type="button"
                onClick={() => act("DISLIKE")}
                aria-label="Descartar"
                className="flex h-16 w-16 items-center justify-center rounded-full border border-border-subtle bg-background-elevated text-ink-secondary"
              >
                <X className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => act("FAVORITE")}
                aria-label="Salvar"
                className="flex h-14 w-14 items-center justify-center rounded-full border border-border-subtle bg-background-elevated text-ink-secondary"
              >
                <Heart className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => act("LIKE")}
                aria-label="Tenho interesse"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-charcoal text-ink-inverse"
              >
                <Heart className="h-6 w-6 fill-current" />
              </button>
            </div>
            <div className="mt-3 flex items-center justify-center gap-6 text-caption text-ink-tertiary">
              <span>Descartar</span>
              <span>Salvar</span>
              <span>Tenho interesse</span>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
