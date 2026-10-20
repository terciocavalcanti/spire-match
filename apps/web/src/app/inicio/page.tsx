"use client";

import { EmptyState, PropertyCard } from "@spire/ui-web";
import { MapPin, Sparkles } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/use-favorites";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useMatches } from "@/hooks/use-matches";

function NextLink({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link href={href} {...props} />;
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export default function HomePage() {
  const { data: user, isLoading: isLoadingUser } = useCurrentUser();
  const geo = useGeolocation();
  const { data: matchesData, isLoading: isLoadingMatches } = useMatches({
    limit: 8,
    lat: geo.location?.lat,
    lng: geo.location?.lng,
  });
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  const matches = matchesData?.items ?? [];
  const [hero, ...rest] = matches;
  const nearby = geo.location ? matches.filter((m) => m.distanceMeters !== null).slice(0, 2) : [];

  if (!isLoadingUser && !user) {
    return (
      <AppShell>
        <div className="px-4 py-6 sm:px-6">
          <EmptyState
            title="Você não está conectado"
            description="Entre na sua conta para ver seus Matches personalizados."
            action={
              <Link
                href="/entrar"
                className="inline-flex h-12 items-center justify-center rounded-pill bg-brand-charcoal px-6 text-button text-ink-inverse"
              >
                Entrar
              </Link>
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        {isLoadingUser ? (
          <div className="h-16 animate-pulse rounded-xl bg-background-subtle" aria-hidden />
        ) : (
          <>
            <h1 className="font-display text-3xl text-ink-primary">
              Bom dia{user ? `, ${firstName(user.name)}` : ""}
            </h1>
            <p className="mt-1 text-bodyLg text-ink-secondary">
              {isLoadingMatches
                ? "Calculando seus Matches…"
                : matches.length > 0
                  ? `Encontramos ${matches.length} novos Matches para você.`
                  : "Complete seu perfil para encontrarmos seus Matches."}
            </p>
          </>
        )}

        {isLoadingMatches ? (
          <div className="mt-6 h-96 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : hero ? (
          <div className="mt-6">
            <PropertyCard
              property={hero.property}
              score={hero.score}
              isFavorite={favoriteIds.has(hero.propertyId)}
              onToggleFavorite={() =>
                toggleFavorite.mutate({ propertyId: hero.propertyId, isFavorite: favoriteIds.has(hero.propertyId) })
              }
              LinkComponent={NextLink}
            />
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              icon={<Sparkles className="h-8 w-8" aria-hidden />}
              title="Seus Matches aparecerão aqui"
              description="Complete suas preferências (orçamento, bairros, quartos) para o Match Engine calcular compatibilidade real com a carteira de imóveis."
              action={
                <Link
                  href="/onboarding"
                  className="inline-flex h-12 items-center justify-center rounded-pill bg-brand-charcoal px-6 text-button text-ink-inverse"
                >
                  Completar meu perfil
                </Link>
              }
            />
          </div>
        )}

        {!isLoadingMatches && rest.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink-primary">Mais Matches para você</h2>
              <Link href="/matches/descobrir" className="text-bodySm font-medium text-ink-secondary">
                Ver todos
              </Link>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {rest.slice(0, 4).map((m) => (
                <PropertyCard
                  key={m.propertyId}
                  property={m.property}
                  score={m.score}
                  isFavorite={favoriteIds.has(m.propertyId)}
                  onToggleFavorite={() =>
                    toggleFavorite.mutate({ propertyId: m.propertyId, isFavorite: favoriteIds.has(m.propertyId) })
                  }
                  LinkComponent={NextLink}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl text-ink-primary">Perto de você agora</h2>
          </div>

          {geo.status === "idle" || geo.status === "denied" || geo.status === "unsupported" ? (
            <button
              type="button"
              onClick={geo.request}
              className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-dashed border-border-subtle bg-background-elevated px-4 py-4 text-left"
            >
              <MapPin className="h-5 w-5 text-ink-tertiary" />
              <span className="text-bodyMd text-ink-secondary">
                {geo.status === "denied"
                  ? "Localização negada. Toque para tentar novamente."
                  : geo.status === "unsupported"
                    ? "Seu navegador não suporta localização."
                    : "Ative a localização para ver imóveis perto de você agora."}
              </span>
            </button>
          ) : geo.status === "requesting" ? (
            <div className="mt-3 h-20 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
          ) : nearby.length > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-4">
              {nearby.map((m) => (
                <PropertyCard
                  key={m.propertyId}
                  property={m.property}
                  score={m.score}
                  distanceMeters={m.distanceMeters}
                  isFavorite={favoriteIds.has(m.propertyId)}
                  onToggleFavorite={() =>
                    toggleFavorite.mutate({ propertyId: m.propertyId, isFavorite: favoriteIds.has(m.propertyId) })
                  }
                  LinkComponent={NextLink}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-bodySm text-ink-secondary">
              Nenhum imóvel disponível perto da sua localização atual no momento.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
