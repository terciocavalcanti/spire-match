"use client";

import { EmptyState, PropertyCard } from "@spire/ui-web";
import { Heart } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { useFavorites, useToggleFavorite } from "@/hooks/use-favorites";

function NextLink({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link href={href} {...props} />;
}

export default function FavoritosPage() {
  const { data, isLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const items = data?.items ?? [];

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Favoritos</h1>

        {isLoading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<Heart className="h-8 w-8" aria-hidden />}
              title="Nenhum favorito ainda"
              description="Toque no coração de um imóvel para salvá-lo aqui."
              action={
                <Link
                  href="/explorar"
                  className="inline-flex h-12 items-center justify-center rounded-pill bg-brand-charcoal px-6 text-button text-ink-inverse"
                >
                  Explorar imóveis
                </Link>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((favorite) => (
              <PropertyCard
                key={favorite.id}
                property={favorite.property}
                isFavorite
                onToggleFavorite={() => toggleFavorite.mutate({ propertyId: favorite.propertyId, isFavorite: true })}
                LinkComponent={NextLink}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
