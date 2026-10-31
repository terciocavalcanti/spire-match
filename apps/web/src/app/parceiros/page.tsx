"use client";

import type { PartnerCategory } from "@spire/contracts";
import { Card, EmptyState } from "@spire/ui-web";
import { Handshake } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { usePartners } from "@/hooks/use-partners";

const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  FINANCIAMENTO: "Financiamento",
  SEGUROS: "Seguros",
  ARQUITETURA: "Arquitetura",
  REFORMA: "Reforma",
  OUTRO: "Outro",
};

export default function ParceirosPage() {
  const { data, isLoading } = usePartners();
  const partners = data?.items ?? [];

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Parceiros</h1>
        <p className="mt-1 text-bodyMd text-ink-secondary">Benefícios selecionados para quem está comprando ou reformando.</p>

        {isLoading ? (
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : partners.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<Handshake className="h-8 w-8" aria-hidden />}
              title="Nenhum parceiro disponível no momento"
              description="Novos benefícios de financiamento, seguros, arquitetura e reforma aparecem aqui assim que publicados."
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {partners.map((partner) => (
              <Card key={partner.id} className="p-5">
                <span className="rounded-pill bg-background-subtle px-2.5 py-1 text-caption font-medium text-ink-secondary">
                  {CATEGORY_LABELS[partner.category]}
                </span>
                <p className="mt-2 font-display text-bodyLg text-ink-primary">{partner.name}</p>
                <p className="mt-1 text-bodySm text-ink-secondary">{partner.description}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {partner.ctaUrl && (
                    <a href={partner.ctaUrl} target="_blank" rel="noopener noreferrer" className="text-bodySm font-medium text-brand-olive hover:underline">
                      {partner.ctaLabel ?? "Saiba mais"}
                    </a>
                  )}
                  {partner.termsUrl && (
                    <a href={partner.termsUrl} target="_blank" rel="noopener noreferrer" className="text-caption text-ink-tertiary hover:underline">
                      Termos e condições
                    </a>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
