"use client";

import type { OwnerLeadStage } from "@spire/contracts";
import { EmptyState, Input } from "@spire/ui-web";
import { Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useOwnerLeads } from "@/hooks/use-owner-leads";
import { OWNER_LEAD_INTENT_LABELS, OWNER_LEAD_STAGE_CLASSES, OWNER_LEAD_STAGE_LABELS } from "@/lib/owner-lead-labels";

const STAGE_FILTERS: Array<{ value: OwnerLeadStage | "ALL"; label: string }> = [
  { value: "ALL", label: "Todos" },
  ...(Object.entries(OWNER_LEAD_STAGE_LABELS) as Array<[OwnerLeadStage, string]>).map(([value, label]) => ({ value, label })),
];

export default function ProprietariosPage() {
  const [stage, setStage] = useState<OwnerLeadStage | "ALL">("ALL");
  const [q, setQ] = useState("");
  const { data, isLoading } = useOwnerLeads({ stage: stage === "ALL" ? undefined : stage, q: q || undefined });
  const items = data?.items ?? [];

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Proprietários</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">Autorizações de captação, intenção de venda/locação e consentimentos do proprietário.</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="sm:w-80">
          <Input placeholder="Buscar por nome ou e-mail" icon={<Search className="h-4 w-4" aria-hidden />} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          {STAGE_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStage(filter.value)}
              className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${
                stage === filter.value ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"
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
        ) : items.length === 0 ? (
          <EmptyState title="Nenhuma captação encontrada" description="Ajuste os filtros ou aguarde novas solicitações de proprietários." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Proprietário</th>
                  <th className="px-4 py-3">Imóvel</th>
                  <th className="px-4 py-3">Intenção</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Corretor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-background-subtle">
                    <td className="px-4 py-3">
                      <Link href={`/admin/proprietarios/${item.id}`} className="font-medium text-ink-primary hover:underline">
                        {item.owner.name}
                      </Link>
                      <p className="text-caption text-ink-tertiary">{item.owner.email}</p>
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">
                      {item.neighborhood}, {item.city}
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{OWNER_LEAD_INTENT_LABELS[item.intent]}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-pill px-2.5 py-1 text-caption font-medium ${OWNER_LEAD_STAGE_CLASSES[item.stage]}`}>
                        {OWNER_LEAD_STAGE_LABELS[item.stage]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{item.assignedBroker?.name ?? "Não atribuído"}</td>
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
