"use client";

import type { Lead, LeadStage } from "@spire/contracts";
import { Button, Card } from "@spire/ui-web";
import Link from "next/link";
import { useState } from "react";

import { useUpdateLeadStage } from "@/hooks/use-leads";
import { LEAD_STAGE_LABELS, LEAD_TEMPERATURE_CLASSES, LEAD_TEMPERATURE_LABELS } from "@/lib/lead-labels";

export function KanbanLeadCard({ lead }: { lead: Lead }) {
  const updateStage = useUpdateLeadStage(lead.id);
  const [targetStage, setTargetStage] = useState<LeadStage | "">("");
  const [lostReason, setLostReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleMove = async (stage: LeadStage) => {
    if (stage === "PERDIDO" && !lostReason.trim()) {
      setTargetStage(stage);
      return;
    }
    setError(null);
    try {
      await updateStage.mutateAsync({ stage, lostReason: stage === "PERDIDO" ? lostReason.trim() : undefined });
      setTargetStage("");
      setLostReason("");
    } catch {
      setError("Não foi possível mover este lead.");
    }
  };

  return (
    <Card className="p-3">
      <Link href={`/admin/leads/${lead.id}`} className="text-bodySm font-medium text-ink-primary hover:underline">
        {lead.buyer.name}
      </Link>
      <div className="mt-1 flex items-center justify-between">
        <span className={`rounded-pill px-2 py-0.5 text-caption font-medium ${LEAD_TEMPERATURE_CLASSES[lead.temperature]}`}>
          {LEAD_TEMPERATURE_LABELS[lead.temperature]}
        </span>
        <span className="text-caption text-ink-tertiary">Score {lead.score}</span>
      </div>
      {lead.sourceProperty && <p className="mt-1 truncate text-caption text-ink-tertiary">{lead.sourceProperty.title}</p>}

      <select
        value=""
        onChange={(e) => handleMove(e.target.value as LeadStage)}
        disabled={updateStage.isPending}
        className="mt-2 h-8 w-full rounded-lg border border-border-subtle bg-background-elevated px-2 text-caption text-ink-secondary focus:border-brand-olive focus:outline-none"
      >
        <option value="">Mover para…</option>
        {(Object.entries(LEAD_STAGE_LABELS) as Array<[LeadStage, string]>)
          .filter(([stage]) => stage !== lead.stage)
          .map(([stage, label]) => (
            <option key={stage} value={stage}>
              {label}
            </option>
          ))}
      </select>

      {targetStage === "PERDIDO" && (
        <div className="mt-2 space-y-2">
          <input
            value={lostReason}
            onChange={(e) => setLostReason(e.target.value)}
            placeholder="Motivo da perda"
            className="h-8 w-full rounded-lg border border-border-subtle bg-background-elevated px-2 text-caption text-ink-primary placeholder:text-ink-tertiary focus:border-brand-olive focus:outline-none"
          />
          <Button size="sm" className="h-7 w-full text-caption" onClick={() => handleMove("PERDIDO")}>
            Confirmar perda
          </Button>
        </div>
      )}
      {error && <p className="mt-1 text-caption text-status-danger">{error}</p>}
    </Card>
  );
}
