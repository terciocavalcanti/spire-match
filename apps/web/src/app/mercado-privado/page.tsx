"use client";

import type { PrivateMarketOffer, PropertyType } from "@spire/contracts";
import { Button, Card, EmptyState } from "@spire/ui-web";
import { CheckCircle2, EyeOff } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePrivateMarketOffers, useRequestPrivateMarketContact } from "@/hooks/use-private-market";

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTAMENTO: "Apartamento",
  CASA: "Casa",
  COBERTURA: "Cobertura",
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function OfferCard({ offer, isLoggedIn }: { offer: PrivateMarketOffer; isLoggedIn: boolean }) {
  const requestContact = useRequestPrivateMarketContact(offer.id);

  return (
    <Card className="p-5">
      <span className="inline-flex items-center gap-1 rounded-pill bg-background-subtle px-2.5 py-1 text-caption font-medium text-ink-secondary">
        <EyeOff className="h-3 w-3" aria-hidden />
        Off-market
      </span>
      <p className="mt-2 font-display text-bodyLg text-ink-primary">
        {PROPERTY_TYPE_LABELS[offer.propertyType]} em {offer.neighborhood}
      </p>
      <p className="text-bodySm text-ink-secondary">{offer.city}</p>

      <div className="mt-2">
        {offer.minPrice ? (
          <>
            <p className="text-caption text-ink-tertiary">A partir de</p>
            <p className="font-display text-bodyLg text-ink-primary">{currencyFormatter.format(offer.minPrice)}</p>
          </>
        ) : (
          <p className="font-display text-bodyLg text-ink-primary">Sob consulta</p>
        )}
      </div>

      <p className="mt-3 text-bodySm text-ink-secondary">
        {offer.areaSqm} m² · {offer.bedrooms} qts · {offer.parkingSpaces} vagas
      </p>
      {offer.anonymizedSummary && <p className="mt-2 text-bodySm text-ink-secondary">{offer.anonymizedSummary}</p>}

      <p className="mt-3 text-caption text-ink-tertiary">
        Endereço exato e fotos ficam reservados — contato sempre intermediado pela VALORI MATCH.
      </p>

      {requestContact.isSuccess ? (
        <p className="mt-4 flex items-center gap-2 text-bodySm font-medium text-status-success">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Pedido enviado — nosso time vai entrar em contato.
        </p>
      ) : isLoggedIn ? (
        <Button className="mt-4 w-full" size="sm" disabled={requestContact.isPending} onClick={() => requestContact.mutate({ message: "" })}>
          {requestContact.isPending ? "Enviando…" : "Pedir contato"}
        </Button>
      ) : (
        <a
          href="/entrar"
          className="mt-4 flex h-10 w-full items-center justify-center rounded-pill bg-brand-charcoal text-button text-ink-inverse"
        >
          Entrar para pedir contato
        </a>
      )}
    </Card>
  );
}

export default function MercadoPrivadoPage() {
  const { data: user } = useCurrentUser();
  const [city, setCity] = useState("");
  const { data, isLoading } = usePrivateMarketOffers({ city: city || undefined });
  const items = data?.items ?? [];

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Mercado Privado</h1>
        <p className="mt-1 text-bodyMd text-ink-secondary">
          Oportunidades off-market, verificadas pela VALORI — sem endereço, sem fotos, contato sempre intermediado.
        </p>

        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Filtrar por cidade"
          className="mt-4 h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-4 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:outline-none sm:w-80"
        />

        {isLoading ? (
          <div className="mt-6 h-72 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<EyeOff className="h-8 w-8" aria-hidden />}
              title="Nenhuma oferta no momento"
              description="Ofertas off-market verificadas pelo time comercial aparecem aqui assim que disponíveis."
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {items.map((offer) => (
              <OfferCard key={offer.id} offer={offer} isLoggedIn={!!user} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
