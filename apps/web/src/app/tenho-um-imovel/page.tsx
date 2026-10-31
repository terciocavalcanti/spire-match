"use client";

import type { OwnerLeadIntent, PropertyType } from "@spire/contracts";
import { Button, Card, EmptyState, Input } from "@spire/ui-web";
import { CheckCircle2, MessagesSquare } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateOwnerLead } from "@/hooks/use-owner-leads";

const INTENT_LABELS: Record<OwnerLeadIntent, string> = {
  VENDER: "Vender",
  ALUGAR: "Alugar",
  ACEITAR_PROPOSTA: "Avaliar uma proposta",
};

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTAMENTO: "Apartamento",
  CASA: "Casa",
  COBERTURA: "Cobertura",
};

export default function TenhoUmImovelPage() {
  const { data: user, isLoading: loadingUser } = useCurrentUser();

  const [intent, setIntent] = useState<OwnerLeadIntent>("VENDER");
  const [propertyType, setPropertyType] = useState<PropertyType>("APARTAMENTO");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [areaSqm, setAreaSqm] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [parkingSpaces, setParkingSpaces] = useState("");
  const [askingPrice, setAskingPrice] = useState("");
  const [description, setDescription] = useState("");
  const [consent, setConsent] = useState(false);
  const [privateMarketOptIn, setPrivateMarketOptIn] = useState(false);

  const createOwnerLead = useCreateOwnerLead();

  if (loadingUser) {
    return (
      <AppShell>
        <div className="px-4 py-6 sm:px-6">
          <div className="h-32 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="px-4 py-6 sm:px-6">
          <EmptyState
            title="Você não está conectado"
            description="Entre na sua conta para solicitar a captação do seu imóvel."
            action={
              <a href="/entrar" className="inline-flex h-12 items-center justify-center rounded-pill bg-brand-charcoal px-6 text-button text-ink-inverse">
                Entrar
              </a>
            }
          />
        </div>
      </AppShell>
    );
  }

  if (createOwnerLead.isSuccess) {
    return (
      <AppShell>
        <div className="px-4 py-6 sm:px-6">
          <Card className="flex items-start gap-3 p-5">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-status-success" />
            <div>
              <p className="font-display text-bodyLg text-ink-primary">Captação solicitada</p>
              <p className="mt-1 text-bodySm text-ink-secondary">
                Nosso time comercial vai avaliar as informações e entrar em contato para os próximos passos.
              </p>
            </div>
          </Card>

          <Card className="mt-4 flex items-start gap-3 p-5">
            <MessagesSquare className="mt-0.5 h-5 w-5 shrink-0 text-ink-secondary" />
            <div>
              <p className="font-display text-bodyLg text-ink-primary">Quanto vale o seu imóvel?</p>
              <p className="mt-1 text-bodySm text-ink-secondary">
                Avaliação automática ainda não está disponível — fale com um consultor para uma estimativa real, baseada no
                mercado da sua região.
              </p>
            </div>
          </Card>
        </div>
      </AppShell>
    );
  }

  const canSubmit =
    consent && neighborhood.trim() && city.trim() && state.trim().length === 2 && areaSqm && Number(areaSqm) > 0;

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Tenho um imóvel</h1>
        <p className="mt-1 text-bodySm text-ink-secondary">
          Conte sobre o seu imóvel — nosso time comercial avalia e retorna com os próximos passos.
        </p>

        <h2 className="mt-6 text-bodySm font-semibold text-ink-primary">O que você deseja?</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(INTENT_LABELS) as OwnerLeadIntent[]).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIntent(i)}
              className={`rounded-pill px-4 py-2 text-bodySm font-medium transition-colors ${
                intent === i ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary"
              }`}
            >
              {INTENT_LABELS[i]}
            </button>
          ))}
        </div>

        <h2 className="mt-6 text-bodySm font-semibold text-ink-primary">Tipo de imóvel</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPropertyType(t)}
              className={`rounded-pill px-4 py-2 text-bodySm font-medium transition-colors ${
                propertyType === t ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary"
              }`}
            >
              {PROPERTY_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input placeholder="Bairro" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          <Input placeholder="Cidade" value={city} onChange={(e) => setCity(e.target.value)} />
          <Input placeholder="UF" maxLength={2} value={state} onChange={(e) => setState(e.target.value)} />
          <Input placeholder="Área (m²)" type="number" value={areaSqm} onChange={(e) => setAreaSqm(e.target.value)} />
          <Input placeholder="Quartos" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
          <Input placeholder="Vagas" type="number" value={parkingSpaces} onChange={(e) => setParkingSpaces(e.target.value)} />
          <Input
            placeholder="Preço pretendido (opcional)"
            type="number"
            value={askingPrice}
            onChange={(e) => setAskingPrice(e.target.value)}
            className="sm:col-span-2"
          />
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Conte mais sobre o imóvel (opcional)"
          className="mt-3 w-full rounded-xl border border-border-subtle bg-background-elevated px-4 py-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:outline-none"
        />

        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-2 text-bodySm text-ink-secondary">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-border-strong" />
            Autorizo a VALORI MATCH a avaliar estas informações e, mediante minha aprovação em cada etapa, divulgar o imóvel.
          </label>
          <label className="flex items-start gap-2 text-bodySm text-ink-secondary">
            <input
              type="checkbox"
              checked={privateMarketOptIn}
              onChange={(e) => setPrivateMarketOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border-strong"
            />
            Também quero ser considerado para o Mercado Privado (oferta anônima, sem endereço nem fotos públicas, contato sempre
            intermediado pela VALORI).
          </label>
        </div>

        {createOwnerLead.isError && (
          <p className="mt-3 text-bodySm text-status-danger">
            {createOwnerLead.error instanceof Error ? createOwnerLead.error.message : "Não foi possível enviar — tente novamente."}
          </p>
        )}

        <Button
          className="mt-5 w-full"
          disabled={!canSubmit || createOwnerLead.isPending}
          onClick={() =>
            createOwnerLead.mutate({
              intent,
              propertyType,
              neighborhood: neighborhood.trim(),
              city: city.trim(),
              state: state.trim(),
              areaSqm: Number(areaSqm),
              bedrooms: bedrooms ? Number(bedrooms) : 0,
              parkingSpaces: parkingSpaces ? Number(parkingSpaces) : 0,
              askingPrice: askingPrice ? Number(askingPrice) : null,
              description: description.trim(),
              consent: true,
              privateMarketOptIn,
            })
          }
        >
          {createOwnerLead.isPending ? "Enviando..." : "Solicitar captação"}
        </Button>
      </div>
    </AppShell>
  );
}
