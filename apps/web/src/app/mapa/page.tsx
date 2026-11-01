"use client";

import { Button, EmptyState, MatchBadge } from "@spire/ui-web";
import { BedDouble, Car, List, LocateFixed, Maximize, Minimize, Navigation, Ruler } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useMatches } from "@/hooks/use-matches";
import { useRoute } from "@/hooks/use-route";

// Leaflet acessa `window` no carregamento do módulo — precisa ficar fora do
// caminho de SSR (o próprio componente já é "use client", mas o Next ainda
// faz SSR de componentes client por padrão).
const PropertyMap = dynamic(() => import("@/components/map/PropertyMap").then((m) => m.PropertyMap), {
  ssr: false,
  loading: () => <div className="h-[58dvh] w-full animate-pulse bg-background-subtle" aria-hidden />,
});

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

// Centro padrão: Boa Viagem, Recife — mesma região da carteira de demonstração.
const DEFAULT_CENTER = { lat: -8.1222, lng: -34.9021 };

export default function MapaPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="h-[58dvh] w-full animate-pulse bg-background-subtle" aria-hidden />
        </AppShell>
      }
    >
      <MapaPageInner />
    </Suspense>
  );
}

function MapaPageInner() {
  const geo = useGeolocation();
  // useSearchParams() exige um limite Suspense no App Router (Next.js lança
  // erro de prerender sem isso) — por isso a lógica fica num componente
  // interno, envolvido pelo <Suspense> em MapaPage acima.
  const searchParams = useSearchParams();
  const { data, isLoading } = useMatches({ limit: 50 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Vem do convite "Deseja procurar oportunidades agora?" na Home — o clique
  // lá já é o gesto explícito do usuário; ativar aqui (não lá) evita que o
  // watchPosition seja cancelado pelo desmonte da Home antes da resposta
  // chegar (ver NearbyOpportunitiesPrompt).
  useEffect(() => {
    if (searchParams.get("ativarLocalizacao") === "1" && geo.status === "idle") {
      geo.request();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só na montagem, nunca de novo se o status mudar depois
  }, []);

  const points = useMemo(
    () => (data?.items ?? []).filter((m) => m.property.location).map((m) => ({ property: m.property, score: m.score })),
    [data],
  );

  const selected = points.find((p) => p.property.id === selectedId) ?? points[0];
  const center = geo.location ?? DEFAULT_CENTER;
  const route = useRoute(geo.location, selected?.property.location ?? null);

  return (
    <AppShell
      headerSlot={
        <div className="flex items-center justify-between gap-2 px-4 pb-3 sm:px-6">
          <p className="text-bodySm text-ink-secondary">
            {isLoading ? "Carregando imóveis…" : `${points.length} imóveis no mapa`}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={geo.toggle}
              aria-pressed={geo.status === "granted"}
              className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-bodySm ${
                geo.status === "granted"
                  ? "bg-chip-activeBg text-chip-activeFg"
                  : "bg-background-subtle text-ink-secondary"
              }`}
            >
              <LocateFixed className="h-3.5 w-3.5" />
              {geo.status === "granted" ? "Localização ativa" : "Minha localização"}
            </button>
            <Link
              href="/explorar"
              aria-label="Ver em lista"
              className="flex h-9 w-9 items-center justify-center rounded-pill bg-background-subtle text-ink-secondary"
            >
              <List className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      }
    >
      {points.length === 0 && !isLoading ? (
        <div className="px-4 py-6 sm:px-6">
          <EmptyState title="Nenhum imóvel com localização disponível" description="Complete seu perfil para calcularmos Matches geolocalizados." />
        </div>
      ) : (
        <div className={isFullscreen ? "fixed inset-0 z-50 flex flex-col bg-background-base" : "relative"}>
          <PropertyMap
            points={points}
            center={center}
            userLocation={geo.location}
            selectedPropertyId={selected?.property.id}
            onSelect={setSelectedId}
            routeCoordinates={route.data?.coordinates ?? null}
            className={`isolate w-full bg-background-subtle ${isFullscreen ? "flex-1" : "h-[48dvh]"}`}
          />

          <button
            type="button"
            onClick={() => setIsFullscreen((v) => !v)}
            aria-label={isFullscreen ? "Sair da tela cheia" : "Ver mapa em tela cheia"}
            className="absolute left-3 top-3 z-[1001] flex h-9 w-9 items-center justify-center rounded-full bg-background-elevated/90 text-ink-primary shadow-sm"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>

          {selected && (
            <div className="relative -mt-6 mx-4 mb-4 overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated shadow-lg sm:mx-6">
              <div className="flex gap-3 p-3">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-background-subtle">
                  {selected.property.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.property.coverImageUrl} alt={selected.property.title} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-bodySm uppercase tracking-wide text-ink-tertiary">
                      {selected.property.type}
                    </p>
                    <MatchBadge score={selected.score ?? null} className="shrink-0" />
                  </div>
                  <p className="font-display text-lg text-ink-primary">{currencyFormatter.format(selected.property.price)}</p>
                  <p className="truncate text-bodySm text-ink-secondary">{selected.property.neighborhood}, {selected.property.city}</p>
                  <div className="mt-1 flex items-center gap-3 text-caption text-ink-secondary">
                    <span className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" /> {selected.property.areaSqm.toFixed(0)} m²
                    </span>
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" /> {selected.property.bedrooms}
                    </span>
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" /> {selected.property.parkingSpaces}
                    </span>
                  </div>
                  {geo.location ? (
                    route.isFetching ? (
                      <p className="mt-1 text-caption text-ink-tertiary">Calculando rota…</p>
                    ) : route.data ? (
                      <p className="mt-1 flex items-center gap-1 text-caption text-ink-secondary">
                        <Navigation className="h-3 w-3" aria-hidden />
                        {(route.data.distanceMeters / 1000).toFixed(1)} km · {Math.round(route.data.durationSeconds / 60)} min de carro
                      </p>
                    ) : null
                  ) : (
                    <p className="mt-1 text-caption text-ink-tertiary">Ative sua localização para ver a rota até aqui.</p>
                  )}
                </div>
              </div>
              <div className="px-3 pb-3">
                <Link href={`/imoveis/${selected.property.slug}`}>
                  <Button className="w-full" size="sm">
                    Ver imóvel
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
