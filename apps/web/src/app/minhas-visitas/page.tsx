"use client";

import type { ProposalStatus } from "@spire/contracts";
import { Card, EmptyState } from "@spire/ui-web";
import { CalendarX2 } from "lucide-react";
import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { useMyProposals } from "@/hooks/use-proposals";
import { useCancelVisit, useMyVisits } from "@/hooks/use-visits";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  PENDING: "Aguardando retorno",
  ACCEPTED: "Aceita",
  REJECTED: "Recusada",
  COUNTERED: "Contraproposta recebida",
  WITHDRAWN: "Retirada",
};

export default function MinhasVisitasPage() {
  const { data: visitsData, isLoading: loadingVisits } = useMyVisits();
  const { data: proposalsData, isLoading: loadingProposals } = useMyProposals();
  const cancelVisit = useCancelVisit();

  const visits = (visitsData?.items ?? []).filter((v) => v.status !== "CANCELLED");
  const proposals = proposalsData?.items ?? [];

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Minhas visitas</h1>

        <h2 className="mt-6 font-display text-lg text-ink-primary">Próximas visitas</h2>
        {loadingVisits ? (
          <div className="mt-3 h-20 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : visits.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Nenhuma visita agendada" description="Agende uma visita a partir da página de um imóvel." />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {visits.map((visit) => {
              const when = new Date(visit.scheduledAt).toLocaleString("pt-BR", {
                timeZone: "America/Recife",
                dateStyle: "full",
                timeStyle: "short",
              });
              return (
                <Card key={visit.id} className="p-4">
                  <Link href={`/imoveis/${visit.property.slug}`} className="text-bodyLg font-medium text-ink-primary">
                    {visit.property.title}
                  </Link>
                  <p className="mt-1 text-bodySm text-ink-secondary">com {visit.broker.name}</p>
                  <p className="mt-1 text-bodySm capitalize text-ink-secondary">{when}</p>
                  {visit.notes && <p className="mt-1 text-caption text-ink-tertiary">&ldquo;{visit.notes}&rdquo;</p>}
                  <button
                    type="button"
                    onClick={() => cancelVisit.mutate(visit.id)}
                    disabled={cancelVisit.isPending}
                    className="mt-3 flex items-center gap-1.5 text-bodySm font-medium text-status-danger"
                  >
                    <CalendarX2 className="h-4 w-4" />
                    Cancelar visita
                  </button>
                </Card>
              );
            })}
          </div>
        )}

        <h2 className="mt-8 font-display text-lg text-ink-primary">Propostas enviadas</h2>
        {loadingProposals ? (
          <div className="mt-3 h-20 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : proposals.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Nenhuma proposta enviada" description="Envie uma proposta a partir da página de um imóvel." />
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {proposals.map((proposal) => (
              <Card key={proposal.id} className="p-4">
                <Link href={`/imoveis/${proposal.property.slug}`} className="text-bodyLg font-medium text-ink-primary">
                  {proposal.property.title}
                </Link>
                <p className="mt-1 text-bodySm text-ink-secondary">{currencyFormatter.format(proposal.amount)}</p>
                <span className="mt-2 inline-block rounded-pill bg-background-subtle px-3 py-1 text-caption font-medium text-ink-secondary">
                  {PROPOSAL_STATUS_LABEL[proposal.status]}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
