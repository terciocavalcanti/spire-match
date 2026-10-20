"use client";

import type { AiSearchResponse, PropertyType } from "@spire/contracts";
import { EmptyState, FilterChip, PropertyCard } from "@spire/ui-web";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { AiConciergeBar } from "@/components/explorar/AiConciergeBar";
import { AppShell } from "@/components/layout/AppShell";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/use-favorites";
import { apiClient } from "@/lib/api-client";
import { filtersToSearchParams, searchParamsToFilters } from "@/lib/property-filters";

function NextLink({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link href={href} {...props} />;
}

const TYPE_FILTERS: { label: string; value: PropertyType | undefined }[] = [
  { label: "Todos", value: undefined },
  { label: "Apartamentos", value: "APARTAMENTO" },
  { label: "Casas", value: "CASA" },
  { label: "Coberturas", value: "COBERTURA" },
];

function ExplorarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = useMemo(() => searchParamsToFilters(searchParams), [searchParams]);

  const [q, setQ] = useState(initial.q);
  const [aiResult, setAiResult] = useState<AiSearchResponse | null>(null);
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const activeFilterCount = [
    initial.neighborhoods.length > 0,
    initial.priceMin !== undefined,
    initial.priceMax !== undefined,
    initial.areaMin !== undefined,
    initial.bedroomsMin !== undefined,
    initial.parkingMin !== undefined,
    initial.purpose !== undefined,
  ].filter(Boolean).length;

  const query = useMemo(
    () => ({
      q: q || undefined,
      type: initial.type,
      purpose: initial.purpose,
      neighborhoods: initial.neighborhoods.length ? initial.neighborhoods : undefined,
      priceMin: initial.priceMin,
      priceMax: initial.priceMax,
      areaMin: initial.areaMin,
      bedroomsMin: initial.bedroomsMin,
      parkingMin: initial.parkingMin,
      limit: 20,
    }),
    [q, initial],
  );

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "search", query],
    queryFn: () => apiClient.properties.search(query),
  });

  function setType(type: PropertyType | undefined) {
    const params = filtersToSearchParams({ ...initial, type });
    router.push(`/explorar?${params.toString()}`);
  }

  const items = aiResult ? aiResult.items : (data?.items ?? []);

  return (
    <AppShell
      headerSlot={
        <div className="px-4 pb-4 sm:px-6">
          <div className="flex gap-2">
            <div className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-border-subtle bg-background-elevated px-4">
              <Search className="h-4 w-4 text-ink-tertiary" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Busque por bairro, rua ou condomínio"
                className="h-full flex-1 bg-transparent text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:outline-none"
              />
            </div>
            <Link
              href={`/explorar/filtros?${filtersToSearchParams(initial).toString()}`}
              aria-label="Filtros avançados"
              className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-border-subtle bg-background-elevated text-ink-primary"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-charcoal text-[10px] text-ink-inverse">
                  {activeFilterCount}
                </span>
              )}
            </Link>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {TYPE_FILTERS.map((filter) => (
              <FilterChip key={filter.label} active={initial.type === filter.value} onClick={() => setType(filter.value)}>
                {filter.label}
              </FilterChip>
            ))}
          </div>
          <AiConciergeBar onResult={setAiResult} />
        </div>
      }
    >
      <div className="px-4 py-4 sm:px-6">
        {!aiResult && isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState title="Nenhum imóvel encontrado" description="Tente ajustar a busca ou os filtros aplicados." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                isFavorite={favoriteIds.has(property.id)}
                onToggleFavorite={() =>
                  toggleFavorite.mutate({ propertyId: property.id, isFavorite: favoriteIds.has(property.id) })
                }
                LinkComponent={NextLink}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ExplorarPage() {
  return (
    <Suspense fallback={null}>
      <ExplorarContent />
    </Suspense>
  );
}
