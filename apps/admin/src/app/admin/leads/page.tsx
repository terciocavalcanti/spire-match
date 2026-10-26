"use client";

import type { LeadStage } from "@spire/contracts";
import { EmptyState, Input } from "@spire/ui-web";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useLeads } from "@/hooks/use-leads";
import { LEAD_STAGE_LABELS, LEAD_TEMPERATURE_CLASSES, LEAD_TEMPERATURE_LABELS } from "@/lib/lead-labels";

const STAGE_FILTERS: Array<{ value: LeadStage | "ALL"; label: string }> = [
  { value: "ALL", label: "Todos" },
  ...(Object.entries(LEAD_STAGE_LABELS) as Array<[LeadStage, string]>).map(([value, label]) => ({ value, label })),
];

export default function LeadsPage() {
  const [stage, setStage] = useState<LeadStage | "ALL">("ALL");
  const [q, setQ] = useState("");
  const { data, isLoading } = useLeads({ stage: stage === "ALL" ? undefined : stage, q: q || undefined });
  const leads = data?.items ?? [];

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Leads / Oportunidades</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">
        Pipeline de leads com Lead Score, temperatura e responsável — calculado a partir de sinais reais de interação.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-80">
          <Input
            placeholder="Buscar por nome ou e-mail"
            icon={<Search className="h-4 w-4" aria-hidden />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STAGE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStage(filter.value)}
              className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${
                stage === filter.value
                  ? "bg-brand-charcoal text-ink-inverse"
                  : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : leads.length === 0 ? (
          <EmptyState title="Nenhum lead encontrado" description="Ajuste os filtros ou aguarde novas interações de compradores." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Comprador</th>
                  <th className="px-4 py-3">Estágio</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Temperatura</th>
                  <th className="px-4 py-3">Responsável</th>
                  <th className="px-4 py-3">Imóvel de origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-background-subtle">
                    <td className="px-4 py-3">
                      <Link href={`/admin/leads/${lead.id}`} className="font-medium text-ink-primary hover:underline">
                        {lead.buyer.name}
                      </Link>
                      <p className="text-caption text-ink-tertiary">{lead.buyer.email}</p>
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{LEAD_STAGE_LABELS[lead.stage]}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-primary">{lead.score}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-pill px-2.5 py-1 text-caption font-medium ${LEAD_TEMPERATURE_CLASSES[lead.temperature]}`}
                      >
                        {LEAD_TEMPERATURE_LABELS[lead.temperature]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">
                      {lead.assignedBroker?.name ?? "Não atribuído"}
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">
                      {lead.sourceProperty?.title ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
