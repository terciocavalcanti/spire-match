"use client";

import type { OwnerLead } from "@spire/contracts";
import { Card } from "@spire/ui-web";
import { Users } from "lucide-react";

import { useDemandMatch } from "@/hooks/use-demand-match";

export function DemandMatchWidget({ ownerLead }: { ownerLead: OwnerLead }) {
  const { data, isLoading } = useDemandMatch({
    neighborhood: ownerLead.neighborhood,
    priceMin: ownerLead.askingPrice ? ownerLead.askingPrice * 0.85 : undefined,
    priceMax: ownerLead.askingPrice ? ownerLead.askingPrice * 1.15 : undefined,
  });

  return (
    <Card className="p-5">
      <h2 className="flex items-center gap-2 font-display text-lg text-ink-primary">
        <Users className="h-4 w-4" aria-hidden />
        Demanda real para este perfil
      </h2>
      <p className="mt-1 text-bodySm text-ink-secondary">
        Compradores com {ownerLead.neighborhood} nos bairros desejados
        {ownerLead.askingPrice ? ", em faixa de orçamento compatível" : ""} — uso interno, não mostrado ao proprietário.
      </p>

      {isLoading ? (
        <div className="mt-3 h-10 w-32 animate-pulse rounded-lg bg-background-subtle" aria-hidden />
      ) : data?.count !== null && data?.count !== undefined ? (
        <p className="mt-3 font-display text-2xl text-ink-primary">{data.count} compradores</p>
      ) : (
        <p className="mt-3 text-bodySm text-ink-tertiary">
          Indisponível — menos de {data?.threshold ?? "poucos"} compradores compatíveis (limiar anti-identificação).
        </p>
      )}
    </Card>
  );
}
