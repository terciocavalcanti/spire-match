"use client";

import type { Lead, LeadStage } from "@spire/contracts";
import { LEAD_STAGES } from "@spire/contracts";

import { AdminShell } from "@/components/layout/AdminShell";
import { KanbanLeadCard } from "@/components/leads/KanbanLeadCard";
import { useLeads } from "@/hooks/use-leads";
import { LEAD_STAGE_LABELS } from "@/lib/lead-labels";

export default function FunilPage() {
  const { data, isLoading } = useLeads({ limit: 100 });
  const leads = data?.items ?? [];

  const byStage = new Map<LeadStage, Lead[]>(LEAD_STAGES.map((stage) => [stage, []]));
  for (const lead of leads) {
    byStage.get(lead.stage)?.push(lead);
  }

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Funil comercial</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">
        Novo → Qualificando → Interesse → Visita → Proposta → Negociação → Ganho/Perdido. Mudanças de estágio avançam
        automaticamente com os sinais do comprador; mudanças manuais ficam disponíveis aqui.
      </p>

      {isLoading ? (
        <div className="mt-6 h-96 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
      ) : (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {LEAD_STAGES.map((stage) => (
            <div key={stage} className="w-64 shrink-0">
              <div className="flex items-center justify-between rounded-t-xl bg-background-subtle px-3 py-2">
                <p className="text-bodySm font-semibold text-ink-primary">{LEAD_STAGE_LABELS[stage]}</p>
                <span className="text-caption text-ink-tertiary">{byStage.get(stage)?.length ?? 0}</span>
              </div>
              <div className="min-h-[120px] space-y-2 rounded-b-xl border border-t-0 border-border-subtle bg-background-base p-2">
                {(byStage.get(stage) ?? []).map((lead) => (
                  <KanbanLeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
