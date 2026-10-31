"use client";

import type { PrivateMarketOfferAdmin, PrivateMarketOfferStatus } from "@spire/contracts";
import { Button, Card } from "@spire/ui-web";
import { EyeOff } from "lucide-react";
import { useState } from "react";

import { usePrivateMarketOfferByOwnerLead, useVerifyPrivateMarketOffer } from "@/hooks/use-private-market";

const STATUS_LABELS: Record<PrivateMarketOfferStatus, string> = {
  PENDENTE_VERIFICACAO: "Pendente de verificação",
  ELEGIVEL: "Elegível",
  INATIVO: "Inativo",
};

const STATUS_CLASSES: Record<PrivateMarketOfferStatus, string> = {
  PENDENTE_VERIFICACAO: "bg-status-warmBg text-status-warm",
  ELEGIVEL: "bg-status-successBg text-status-success",
  INATIVO: "bg-background-subtle text-ink-tertiary",
};

function PrivateMarketOfferForm({ offer, ownerLeadId }: { offer: PrivateMarketOfferAdmin; ownerLeadId: string }) {
  const verify = useVerifyPrivateMarketOffer(offer.id, ownerLeadId);
  const [anonymizedSummary, setAnonymizedSummary] = useState(offer.anonymizedSummary ?? "");
  const [minPrice, setMinPrice] = useState(offer.minPrice ? String(offer.minPrice) : "");
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (status: "ELEGIVEL" | "INATIVO") => {
    setError(null);
    try {
      await verify.mutateAsync({
        status,
        anonymizedSummary: anonymizedSummary.trim() || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
      });
    } catch {
      setError("Informe o resumo anonimizado e o preço mínimo para marcar como elegível.");
    }
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-display text-lg text-ink-primary">
          <EyeOff className="h-4 w-4" aria-hidden />
          Mercado Privado
        </h2>
        <span className={`rounded-pill px-2.5 py-1 text-caption font-medium ${STATUS_CLASSES[offer.status]}`}>{STATUS_LABELS[offer.status]}</span>
      </div>
      <p className="mt-1 text-bodySm text-ink-secondary">
        Proprietário autorizou divulgação anônima (sem endereço nem fotos). Preencha o resumo e o preço mínimo para liberar a oferta.
      </p>

      <textarea
        value={anonymizedSummary}
        onChange={(e) => setAnonymizedSummary(e.target.value)}
        rows={3}
        placeholder="Resumo anonimizado (ex.: &quot;Apartamento reformado, vista livre, andar alto&quot;)"
        className="mt-3 w-full rounded-xl border border-border-subtle bg-background-elevated p-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:border-brand-olive focus:outline-none"
      />
      <input
        type="number"
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
        placeholder="Preço mínimo"
        className="mt-3 h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:border-brand-olive focus:outline-none"
      />

      {error && <p className="mt-2 text-bodySm text-status-danger">{error}</p>}

      <div className="mt-3 flex gap-2">
        <Button size="sm" disabled={verify.isPending} onClick={() => handleVerify("ELEGIVEL")}>
          Marcar como elegível
        </Button>
        <Button size="sm" variant="outline" disabled={verify.isPending} onClick={() => handleVerify("INATIVO")}>
          Marcar como inativo
        </Button>
      </div>
    </Card>
  );
}

export function PrivateMarketOfferCard({ ownerLeadId }: { ownerLeadId: string }) {
  const { data: offer, isLoading } = usePrivateMarketOfferByOwnerLead(ownerLeadId);

  if (isLoading || !offer) return null;

  return <PrivateMarketOfferForm key={`${offer.id}-${offer.verifiedAt ?? "none"}`} offer={offer} ownerLeadId={ownerLeadId} />;
}
