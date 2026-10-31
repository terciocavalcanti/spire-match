"use client";

import type { OwnerLead, OwnerLeadStage } from "@spire/contracts";
import { OWNER_LEAD_STAGES } from "@spire/contracts";

import { AdminShell } from "@/components/layout/AdminShell";
import { KanbanOwnerLeadCard } from "@/components/owner-leads/KanbanOwnerLeadCard";
import { useOwnerLeads } from "@/hooks/use-owner-leads";
import { OWNER_LEAD_STAGE_LABELS } from "@/lib/owner-lead-labels";

export default function CaptacoesPage() {
  const { data, isLoading } = useOwnerLeads({ limit: 100 });
  const ownerLeads = data?.items ?? [];

  const byStage = new Map<OwnerLeadStage, OwnerLead[]>(OWNER_LEAD_STAGES.map((stage) => [stage, []]));
  for (const ownerLead of ownerLeads) {
    byStage.get(ownerLead.stage)?.push(ownerLead);
  }

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Captações</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">Pipeline de captação de imóveis, da triagem à designação de corretor.</p>

      {isLoading ? (
        <div className="mt-6 h-96 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
      ) : (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-4">
          {OWNER_LEAD_STAGES.map((stage) => (
            <div key={stage} className="w-64 shrink-0">
              <div className="flex items-center justify-between rounded-t-xl bg-background-subtle px-3 py-2">
                <p className="text-bodySm font-semibold text-ink-primary">{OWNER_LEAD_STAGE_LABELS[stage]}</p>
                <span className="text-caption text-ink-tertiary">{byStage.get(stage)?.length ?? 0}</span>
              </div>
              <div className="min-h-[120px] space-y-2 rounded-b-xl border border-t-0 border-border-subtle bg-background-base p-2">
                {(byStage.get(stage) ?? []).map((ownerLead) => (
                  <KanbanOwnerLeadCard key={ownerLead.id} ownerLead={ownerLead} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
