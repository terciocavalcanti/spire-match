"use client";

import { EmptyState } from "@spire/ui-web";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useFavorites } from "@/hooks/use-favorites";
import { apiClient } from "@/lib/api-client";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const MAX_COMPARE = 3;

export default function CompararPage() {
  const { data: favoritesData, isLoading: isLoadingFavorites } = useFavorites();
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);

  const { data: properties } = useQuery({
    queryKey: ["compare", selectedSlugs],
    queryFn: async () => Promise.all(selectedSlugs.map((slug) => apiClient.properties.bySlug(slug))),
    enabled: selectedSlugs.length > 0,
  });

  const favorites = favoritesData?.items ?? [];

  function toggle(slug: string) {
    setSelectedSlugs((current) => {
      if (current.includes(slug)) return current.filter((s) => s !== slug);
      if (current.length >= MAX_COMPARE) return current;
      return [...current, slug];
    });
  }

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Comparar imóveis</h1>
        <p className="mt-1 text-bodyMd text-ink-secondary">
          Selecione até {MAX_COMPARE} favoritos para comparar lado a lado.
        </p>

        {isLoadingFavorites ? (
          <div className="mt-6 h-16 animate-pulse rounded-xl bg-background-subtle" aria-hidden />
        ) : favorites.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="Você ainda não tem favoritos" description="Favorite imóveis para poder compará-los aqui." />
          </div>
        ) : (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {favorites.map((favorite) => {
              const selected = selectedSlugs.includes(favorite.property.slug);
              return (
                <button
                  key={favorite.id}
                  type="button"
                  onClick={() => toggle(favorite.property.slug)}
                  aria-pressed={selected}
                  className={
                    selected
                      ? "flex shrink-0 items-center gap-2 rounded-pill bg-brand-charcoal px-4 py-2 text-bodySm text-ink-inverse"
                      : "flex shrink-0 items-center gap-2 rounded-pill bg-background-subtle px-4 py-2 text-bodySm text-ink-secondary"
                  }
                >
                  {favorite.property.title}
                  {selected && <X className="h-3.5 w-3.5" />}
                </button>
              );
            })}
          </div>
        )}

        {properties && properties.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-bodySm">
              <tbody>
                <tr>
                  <td className="py-2 pr-4 text-ink-tertiary">Imóvel</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-2 pr-4 font-display text-bodyMd text-ink-primary">
                      {p.title}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border-subtle">
                  <td className="py-2 pr-4 text-ink-tertiary">Preço</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-2 pr-4 text-ink-primary">
                      {currencyFormatter.format(p.price)}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border-subtle">
                  <td className="py-2 pr-4 text-ink-tertiary">Bairro</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-2 pr-4 text-ink-primary">
                      {p.neighborhood}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border-subtle">
                  <td className="py-2 pr-4 text-ink-tertiary">Metragem</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-2 pr-4 text-ink-primary">
                      {p.areaSqm.toFixed(0)} m²
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border-subtle">
                  <td className="py-2 pr-4 text-ink-tertiary">Quartos</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-2 pr-4 text-ink-primary">
                      {p.bedrooms}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border-subtle">
                  <td className="py-2 pr-4 text-ink-tertiary">Vagas</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-2 pr-4 text-ink-primary">
                      {p.parkingSpaces}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border-subtle">
                  <td className="py-2 pr-4 text-ink-tertiary">Condomínio</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-2 pr-4 text-ink-primary">
                      {p.condominiumFee !== null ? currencyFormatter.format(p.condominiumFee) : "Não informado"}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-border-subtle align-top">
                  <td className="py-2 pr-4 text-ink-tertiary">Diferenciais</td>
                  {properties.map((p) => (
                    <td key={p.id} className="py-2 pr-4 text-ink-primary">
                      {p.features.length > 0 ? p.features.join(", ") : "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
