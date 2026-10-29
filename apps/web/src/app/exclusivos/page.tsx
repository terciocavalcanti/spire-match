"use client";

import { EmptyState, PropertyCard } from "@spire/ui-web";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/use-favorites";
import { apiClient } from "@/lib/api-client";

function NextLink({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link href={href} {...props} />;
}

const EXCLUSIVE_LABELS: Record<string, string> = {
  EXCLUSIVO: "Exclusivo",
  PRE_LANCAMENTO: "Pré-lançamento",
  OPORTUNIDADE: "Oportunidade",
};

export default function ExclusivosPage() {
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "exclusives"],
    queryFn: () => apiClient.properties.search({ exclusivesOnly: true, limit: 20 }),
  });

  const items = data?.items ?? [];

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">VALORI Exclusive</h1>
        <p className="mt-1 text-bodyMd text-ink-secondary">Oportunidades únicas, antes de todos.</p>

        {isLoading ? (
          <div className="mt-6 h-72 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<Star className="h-8 w-8" aria-hidden />}
              title="Nenhuma oportunidade exclusiva no momento"
              description="Exclusivos e pré-lançamentos autorizados aparecem aqui assim que disponíveis."
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((property) => (
              <div key={property.id} className="relative">
                {property.exclusiveType && (
                  <span className="absolute left-3 top-3 z-10 rounded-pill bg-brand-charcoal px-3 py-1 text-caption text-ink-inverse">
                    {EXCLUSIVE_LABELS[property.exclusiveType] ?? property.exclusiveType}
                  </span>
                )}
                <PropertyCard
                  property={property}
                  isFavorite={favoriteIds.has(property.id)}
                  onToggleFavorite={() =>
                    toggleFavorite.mutate({ propertyId: property.id, isFavorite: favoriteIds.has(property.id) })
                  }
                  LinkComponent={NextLink}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
