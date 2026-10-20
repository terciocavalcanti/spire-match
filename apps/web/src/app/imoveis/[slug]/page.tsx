"use client";

import { Button, MatchBadge, PropertyGallery } from "@spire/ui-web";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BedDouble, Car, ChevronLeft, Heart, Ruler, Share2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef } from "react";

import { useFavoriteIds, useToggleFavorite } from "@/hooks/use-favorites";
import { useMatchForProperty } from "@/hooks/use-matches";
import { apiClient } from "@/lib/api-client";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const REASON_LABELS: Record<string, string> = {
  BUDGET_FIT: "Dentro do seu orçamento",
  PREFERRED_AREA: "No bairro que você procura",
  NEARBY: "Perto de você",
  AREA_FIT: "Metragem compatível",
  ROOMS_FIT: "Número de quartos ideal",
  FEATURES_FIT: "Com as características que você busca",
  PURPOSE_FIT: "Alinhado ao seu objetivo",
  PAYMENT_FIT: "Aceita sua forma de pagamento",
  PREFERENCE_SIGNAL: "Parecido com imóveis que você curtiu",
};

export default function ImovelPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const favoriteIds = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const viewRecorded = useRef(false);

  const { data: property, isLoading } = useQuery({
    queryKey: ["property", slug],
    queryFn: () => apiClient.properties.bySlug(slug),
  });
  const { data: match } = useMatchForProperty(property?.id);

  useEffect(() => {
    if (property && !viewRecorded.current) {
      viewRecorded.current = true;
      void apiClient.interactions.create({ propertyId: property.id, type: "VIEW" });
    }
  }, [property]);

  if (isLoading) {
    return (
      <main className="min-h-dvh">
        <div className="aspect-[4/3] w-full animate-pulse bg-background-subtle sm:aspect-[16/9]" aria-hidden />
      </main>
    );
  }

  if (!property) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-display text-2xl text-ink-primary">Imóvel não encontrado</p>
        <Link href="/explorar" className="text-bodyMd font-medium text-ink-primary underline">
          Voltar para Explorar
        </Link>
      </main>
    );
  }

  const isFavorite = favoriteIds.has(property.id);

  return (
    <main className="min-h-dvh pb-28">
      <PropertyGallery
        images={property.images}
        title={property.title}
        topLeftSlot={
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-background-elevated/90 text-ink-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        }
        topRightSlot={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={async () => {
                await apiClient.interactions.create({ propertyId: property.id, type: "SHARE" });
                if (navigator.share) {
                  void navigator.share({ title: property.title, url: window.location.href });
                } else {
                  void navigator.clipboard.writeText(window.location.href);
                }
              }}
              aria-label="Compartilhar"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background-elevated/90 text-ink-primary"
            >
              <Share2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                toggleFavorite.mutate({ propertyId: property.id, isFavorite });
                void apiClient.interactions.create({
                  propertyId: property.id,
                  type: isFavorite ? "UNFAVORITE" : "FAVORITE",
                });
              }}
              aria-label={isFavorite ? "Remover dos favoritos" : "Favoritar"}
              aria-pressed={isFavorite}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-background-elevated/90 text-ink-primary"
            >
              <Heart className={isFavorite ? "h-4 w-4 fill-status-danger text-status-danger" : "h-4 w-4"} />
            </button>
          </div>
        }
      />

      <div className="px-4 py-5 sm:px-6">
        {match && (
          <div className="-mt-12 mb-4">
            <MatchBadge score={match.score} size="lg" />
          </div>
        )}

        <p className="text-bodySm uppercase tracking-wide text-ink-tertiary">{property.type}</p>
        <h1 className="mt-1 font-display text-2xl text-ink-primary">{property.title}</h1>
        <p className="mt-1 text-bodyMd text-ink-secondary">
          {property.neighborhood}, {property.city} — {property.state}
        </p>

        <p className="mt-4 font-display text-3xl text-ink-primary">{currencyFormatter.format(property.price)}</p>

        <div className="mt-3 flex flex-wrap items-center gap-4 border-b border-border-subtle pb-5 text-bodyMd text-ink-secondary">
          <span className="flex items-center gap-1.5">
            <Ruler className="h-4 w-4" /> {property.areaSqm.toFixed(0)} m²
          </span>
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4" /> {property.bedrooms} quartos
          </span>
          <span className="flex items-center gap-1.5">
            <Car className="h-4 w-4" /> {property.parkingSpaces} vagas
          </span>
        </div>

        {match && match.reasons.length > 0 && (
          <div className="border-b border-border-subtle py-5">
            <h2 className="font-display text-xl text-ink-primary">Por que combina com você</h2>
            <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {match.reasons.map((reason) => (
                <li key={reason.code} className="flex items-center gap-2 text-bodyMd text-ink-secondary">
                  <span className="h-1.5 w-1.5 rounded-pill bg-status-success" />
                  {REASON_LABELS[reason.code] ?? reason.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="py-5">
          <h2 className="font-display text-xl text-ink-primary">Descrição</h2>
          <p className="mt-2 whitespace-pre-line text-bodyMd text-ink-secondary">{property.description}</p>
        </div>

        {property.features.length > 0 && (
          <div className="border-t border-border-subtle py-5">
            <h2 className="font-display text-xl text-ink-primary">Características</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {property.features.map((feature) => (
                <span key={feature} className="rounded-pill bg-background-subtle px-3 py-1.5 text-bodySm text-ink-secondary">
                  {feature}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-border-subtle bg-background-elevated p-4">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Olá! Tenho interesse no imóvel ${property.title} (${currencyFormatter.format(property.price)}).`)}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            void apiClient.interactions.create({ propertyId: property.id, type: "CONTACT" });
            void queryClient.invalidateQueries({ queryKey: ["property", slug] });
          }}
          className="flex h-12 flex-1 items-center justify-center rounded-pill border border-border-strong text-button text-ink-primary"
        >
          WhatsApp
        </a>
        <Link
          href={`/visitas/agendar?imovel=${property.slug}`}
          onClick={() => void apiClient.interactions.create({ propertyId: property.id, type: "VISIT_REQUEST" })}
          className="flex-1"
        >
          <Button className="w-full" size="lg">
            Agendar visita
          </Button>
        </Link>
      </div>
    </main>
  );
}
