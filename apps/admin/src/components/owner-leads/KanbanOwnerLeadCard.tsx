"use client";

import type { OwnerLead, OwnerLeadStage } from "@spire/contracts";
import { Button, Card } from "@spire/ui-web";
import Link from "next/link";
import { useState } from "react";

import { useUpdateOwnerLeadStage } from "@/hooks/use-owner-leads";
import { OWNER_LEAD_STAGE_LABELS } from "@/lib/owner-lead-labels";

export function KanbanOwnerLeadCard({ ownerLead }: { ownerLead: OwnerLead }) {
  const updateStage = useUpdateOwnerLeadStage(ownerLead.id);
  const [targetStage, setTargetStage] = useState<OwnerLeadStage | "">("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleMove = async (stage: OwnerLeadStage) => {
    if (stage === "REJEITADO" && !rejectionReason.trim()) {
      setTargetStage(stage);
      return;
    }
    setError(null);
    try {
      await updateStage.mutateAsync({ stage, rejectionReason: stage === "REJEITADO" ? rejectionReason.trim() : undefined });
      setTargetStage("");
      setRejectionReason("");
    } catch {
      setError("Não foi possível mover esta captação.");
    }
  };

  return (
    <Card className="p-3">
      <Link href={`/admin/proprietarios/${ownerLead.id}`} className="text-bodySm font-medium text-ink-primary hover:underline">
        {ownerLead.owner.name}
      </Link>
      <p className="mt-1 truncate text-caption text-ink-tertiary">
        {ownerLead.neighborhood}, {ownerLead.city}
      </p>

      {ownerLead.stage !== "CONVERTIDO" && (
        <select
          value=""
          onChange={(e) => handleMove(e.target.value as OwnerLeadStage)}
          disabled={updateStage.isPending}
          className="mt-2 h-8 w-full rounded-lg border border-border-subtle bg-background-elevated px-2 text-caption text-ink-secondary focus:border-brand-olive focus:outline-none"
        >
          <option value="">Mover para…</option>
          {(Object.entries(OWNER_LEAD_STAGE_LABELS) as Array<[OwnerLeadStage, string]>)
            .filter(([stage]) => stage !== ownerLead.stage && stage !== "CONVERTIDO")
            .map(([stage, label]) => (
              <option key={stage} value={stage}>
                {label}
              </option>
            ))}
        </select>
      )}

      {targetStage === "REJEITADO" && (
        <div className="mt-2 space-y-2">
          <input
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Motivo da rejeição"
            className="h-8 w-full rounded-lg border border-border-subtle bg-background-elevated px-2 text-caption text-ink-primary placeholder:text-ink-tertiary focus:border-brand-olive focus:outline-none"
          />
          <Button size="sm" className="h-7 w-full text-caption" onClick={() => handleMove("REJEITADO")}>
            Confirmar rejeição
          </Button>
        </div>
      )}
      {error && <p className="mt-1 text-caption text-status-danger">{error}</p>}
    </Card>
  );
}
