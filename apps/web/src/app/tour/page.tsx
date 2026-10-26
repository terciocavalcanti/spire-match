"use client";

import { Button, Card, EmptyState, MatchBadge } from "@spire/ui-web";
import { useMutation } from "@tanstack/react-query";
import { Check, Route } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useFavorites } from "@/hooks/use-favorites";
import { apiClient } from "@/lib/api-client";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export default function TourPage() {
  const { data: favorites, isLoading } = useFavorites();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const generateTour = useMutation({
    mutationFn: () => apiClient.tours.generate({ propertyIds: [...selected] }),
  });

  const withLocation = (favorites?.items ?? []).filter((f) => f.property.location);

  function toggle(propertyId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(propertyId)) next.delete(propertyId);
      else if (next.size < 5) next.add(propertyId);
      return next;
    });
    generateTour.reset();
  }

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Tour Inteligente</h1>
        <p className="mt-1 text-bodySm text-ink-secondary">
          Escolha de 2 a 5 imóveis favoritados para montar um roteiro de visita na ordem mais curta entre eles.
        </p>

        {isLoading ? (
          <div className="mt-6 h-32 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : withLocation.length < 2 ? (
          <div className="mt-6">
            <EmptyState
              title="Favorite ao menos 2 imóveis com localização"
              description="O Tour Inteligente monta o roteiro a partir dos imóveis que você favoritou."
            />
          </div>
        ) : (
          <>
            <div className="mt-6 space-y-2">
              {withLocation.map((fav) => {
                const isSelected = selected.has(fav.propertyId);
                return (
                  <button
                    key={fav.propertyId}
                    type="button"
                    onClick={() => toggle(fav.propertyId)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border-subtle bg-background-elevated p-3 text-left"
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                        isSelected ? "border-brand-charcoal bg-brand-charcoal text-ink-inverse" : "border-border-strong"
                      }`}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-bodyMd font-medium text-ink-primary">{fav.property.title}</p>
                      <p className="text-caption text-ink-secondary">
                        {fav.property.neighborhood} · {currencyFormatter.format(fav.property.price)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              className="mt-4 w-full"
              disabled={selected.size < 2 || generateTour.isPending}
              onClick={() => generateTour.mutate()}
            >
              <Route className="h-4 w-4" />
              {generateTour.isPending ? "Montando roteiro…" : `Montar roteiro (${selected.size} imóveis)`}
            </Button>
          </>
        )}

        {generateTour.isError && (
          <p className="mt-3 text-bodySm text-status-danger">
            {generateTour.error instanceof Error ? generateTour.error.message : "Não foi possível montar o roteiro."}
          </p>
        )}

        {generateTour.data && (
          <div className="mt-6">
            <h2 className="font-display text-xl text-ink-primary">
              Roteiro sugerido — {(generateTour.data.totalDistanceMeters / 1000).toFixed(1)} km no total
            </h2>
            <div className="mt-3 space-y-3">
              {generateTour.data.stops.map((stop) => (
                <Card key={stop.property.id} className="flex items-center gap-3 p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-charcoal text-bodySm font-semibold text-ink-inverse">
                    {stop.order + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-bodyMd font-medium text-ink-primary">{stop.property.title}</p>
                    <p className="text-caption text-ink-secondary">
                      {stop.property.neighborhood}
                      {stop.distanceFromPreviousMeters !== null && ` · ${formatDistance(stop.distanceFromPreviousMeters)} do anterior`}
                    </p>
                  </div>
                  {stop.score !== null && <MatchBadge score={stop.score} />}
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
