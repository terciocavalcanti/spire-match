"use client";

import { Button, EmptyState, MatchBadge } from "@spire/ui-web";
import { MapPin } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useMatches } from "@/hooks/use-matches";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

export default function MatchPertoPage() {
  const geo = useGeolocation();
  const { data, isLoading } = useMatches({ limit: 20, lat: geo.location?.lat, lng: geo.location?.lng });

  const withDistance = (data?.items ?? [])
    .filter((m) => m.distanceMeters !== null)
    .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  const nearest = withDistance[0];

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Alerta de oportunidade</h1>
        <p className="mt-1 text-bodyMd text-ink-secondary">Matches perto de você enquanto usa o VALORI MATCH.</p>

        {geo.status === "idle" || geo.status === "denied" || geo.status === "unsupported" ? (
          <div className="mt-6">
            <EmptyState
              icon={<MapPin className="h-8 w-8" aria-hidden />}
              title={geo.status === "denied" ? "Localização negada" : "Ative sua localização"}
              description={
                geo.status === "denied"
                  ? "Sem localização não sabemos a distância real — nenhuma estimativa é exibida sem essa autorização."
                  : "Precisamos da sua localização atual, só durante o uso do app, para calcular imóveis realmente perto de você."
              }
              action={
                <button
                  type="button"
                  onClick={geo.request}
                  className="inline-flex h-12 items-center justify-center rounded-pill bg-brand-charcoal px-6 text-button text-ink-inverse"
                >
                  {geo.status === "unsupported" ? "Selecionar bairro manualmente" : "Ativar localização"}
                </button>
              }
            />
          </div>
        ) : isLoading || geo.status === "requesting" ? (
          <div className="mt-6 h-80 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : !nearest ? (
          <div className="mt-6">
            <EmptyState title="Nenhum imóvel próximo encontrado" description="Não há imóveis disponíveis dentro do raio configurado a partir da sua localização atual." />
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <div className="flex items-center gap-2 border-b border-border-subtle px-5 py-4">
              <MapPin className="h-4 w-4 text-ink-tertiary" />
              <span className="text-bodySm text-ink-secondary">Match perto de você</span>
            </div>
            <div className="px-5 py-4">
              <p className="font-display text-xl text-ink-primary">
                Você está a {formatDistance(nearest.distanceMeters!)} de um imóvel com {nearest.score}% de compatibilidade.
              </p>
            </div>
            <div className="relative aspect-[4/3] w-full bg-background-subtle">
              {nearest.property.coverImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nearest.property.coverImageUrl} alt={nearest.property.title} className="h-full w-full object-cover" />
              )}
              <div className="absolute left-3 top-3">
                <MatchBadge score={nearest.score} />
              </div>
            </div>
            <div className="px-5 py-4">
              <p className="font-display text-2xl text-ink-primary">{currencyFormatter.format(nearest.property.price)}</p>
              <p className="mt-1 text-bodyMd text-ink-secondary">
                {nearest.property.neighborhood}, {nearest.property.city}
              </p>
              <Link href={`/imoveis/${nearest.property.slug}`} className="mt-4 block">
                <Button className="w-full" size="lg">
                  Ver imóvel
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
