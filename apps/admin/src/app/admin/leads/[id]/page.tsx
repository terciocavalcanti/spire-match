"use client";

import type { LeadStage } from "@spire/contracts";
import { Button, Card } from "@spire/ui-web";
import {
  CalendarCheck,
  CalendarX,
  FileText,
  MessageSquare,
  Sparkles,
  StickyNote,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { use, useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useBrokers } from "@/hooks/use-admin-brokers";
import { useAddLeadNote, useAssignLead, useLeadDetail, useUpdateLeadStage } from "@/hooks/use-leads";
import { LEAD_STAGE_LABELS, LEAD_TEMPERATURE_CLASSES, LEAD_TEMPERATURE_LABELS } from "@/lib/lead-labels";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const ACTIVITY_ICONS = {
  CREATED: Sparkles,
  STAGE_CHANGED: FileText,
  CONTACT: MessageSquare,
  VISIT_SCHEDULED: CalendarCheck,
  VISIT_CANCELLED: CalendarX,
  PROPOSAL_RECEIVED: FileText,
  ASSIGNED: UserPlus,
  NOTE: StickyNote,
} as const;

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: lead, isLoading } = useLeadDetail(id);
  const { data: brokersData } = useBrokers();
  const updateStage = useUpdateLeadStage(id);
  const assignLead = useAssignLead(id);
  const addNote = useAddLeadNote(id);

  const [stageDraft, setStageDraft] = useState<LeadStage | "">("");
  const [lostReason, setLostReason] = useState("");
  const [wonAmount, setWonAmount] = useState("");
  const [brokerDraft, setBrokerDraft] = useState("");
  const [note, setNote] = useState("");
  const [stageError, setStageError] = useState<string | null>(null);

  const brokers = brokersData?.items ?? [];
  const currentStage = stageDraft || lead?.stage || "";

  if (isLoading || !lead) {
    return (
      <AdminShell>
        <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
      </AdminShell>
    );
  }

  const handleSaveStage = async () => {
    if (!stageDraft || stageDraft === lead.stage) return;
    setStageError(null);
    try {
      await updateStage.mutateAsync({
        stage: stageDraft,
        lostReason: stageDraft === "PERDIDO" ? lostReason.trim() : undefined,
        wonAmount: stageDraft === "GANHO" && wonAmount ? Number(wonAmount) : undefined,
      });
      setStageDraft("");
      setLostReason("");
      setWonAmount("");
    } catch {
      setStageError(
        stageDraft === "PERDIDO"
          ? "Informe o motivo da perda para concluir esta mudança de estágio."
          : stageDraft === "GANHO"
            ? "Informe o valor da venda (VGV) para concluir esta mudança de estágio."
            : "Não foi possível atualizar o estágio. Tente novamente.",
      );
    }
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="font-display text-2xl text-ink-primary">{lead.buyer.name}</h1>
            <p className="text-bodySm text-ink-secondary">{lead.buyer.email}</p>
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-bodySm text-ink-secondary">Lead Score</p>
                <p className="font-display text-3xl text-ink-primary">{lead.score}</p>
              </div>
              <span className={`rounded-pill px-3 py-1.5 text-bodySm font-medium ${LEAD_TEMPERATURE_CLASSES[lead.temperature]}`}>
                {LEAD_TEMPERATURE_LABELS[lead.temperature]}
              </span>
              <div>
                <p className="text-bodySm text-ink-secondary">Imóvel de origem</p>
                <p className="text-bodyMd text-ink-primary">{lead.sourceProperty?.title ?? "—"}</p>
              </div>
              {lead.wonAmount && (
                <div>
                  <p className="text-bodySm text-ink-secondary">Valor da venda</p>
                  <p className="text-bodyMd font-medium text-status-success">{currencyFormatter.format(lead.wonAmount)}</p>
                </div>
              )}
              {lead.lostReason && (
                <div>
                  <p className="text-bodySm text-ink-secondary">Motivo da perda</p>
                  <p className="text-bodyMd text-status-danger">{lead.lostReason}</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg text-ink-primary">Linha do tempo</h2>
            <ol className="mt-4 space-y-4">
              {lead.activities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type];
                return (
                  <li key={activity.id} className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background-subtle text-ink-secondary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div>
                      <p className="text-bodyMd text-ink-primary">{activity.description}</p>
                      <p className="text-caption text-ink-tertiary">
                        {new Date(activity.createdAt).toLocaleString("pt-BR", {
                          timeZone: "America/Recife",
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg text-ink-primary">Adicionar nota interna</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Registre uma observação sobre este lead…"
              rows={3}
              className="mt-3 w-full rounded-xl border border-border-subtle bg-background-elevated p-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:border-brand-olive focus:outline-none"
            />
            <Button
              className="mt-3"
              size="sm"
              disabled={!note.trim() || addNote.isPending}
              onClick={() => {
                addNote.mutate({ note: note.trim() }, { onSuccess: () => setNote("") });
              }}
            >
              {addNote.isPending ? "Salvando…" : "Adicionar nota"}
            </Button>
          </Card>
        </div>

        <div className="w-full space-y-6 lg:w-80">
          <Card className="p-5">
            <h2 className="font-display text-lg text-ink-primary">Estágio do funil</h2>
            <select
              value={currentStage}
              onChange={(e) => setStageDraft(e.target.value as LeadStage)}
              className="mt-3 h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
            >
              {(Object.entries(LEAD_STAGE_LABELS) as Array<[LeadStage, string]>).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {stageDraft === "PERDIDO" && (
              <textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="Motivo da perda (obrigatório)"
                rows={2}
                className="mt-3 w-full rounded-xl border border-border-subtle bg-background-elevated p-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:border-brand-olive focus:outline-none"
              />
            )}
            {stageDraft === "GANHO" && (
              <input
                type="number"
                value={wonAmount}
                onChange={(e) => setWonAmount(e.target.value)}
                placeholder="Valor da venda — VGV (obrigatório)"
                className="mt-3 h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:border-brand-olive focus:outline-none"
              />
            )}
            {stageError && <p className="mt-2 text-bodySm text-status-danger">{stageError}</p>}

            <Button
              className="mt-3 w-full"
              size="sm"
              disabled={!stageDraft || stageDraft === lead.stage || updateStage.isPending}
              onClick={handleSaveStage}
            >
              {updateStage.isPending ? "Salvando…" : "Salvar estágio"}
            </Button>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-ink-primary">
              <UserCheck className="h-4 w-4" aria-hidden />
              Corretor responsável
            </h2>
            <p className="mt-1 text-bodySm text-ink-secondary">{lead.assignedBroker?.name ?? "Não atribuído"}</p>
            <select
              value={brokerDraft}
              onChange={(e) => setBrokerDraft(e.target.value)}
              className="mt-3 h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
            >
              <option value="">Selecionar corretor…</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.name}
                </option>
              ))}
            </select>
            <Button
              className="mt-3 w-full"
              size="sm"
              variant="outline"
              disabled={!brokerDraft || assignLead.isPending}
              onClick={() => assignLead.mutate({ brokerId: brokerDraft }, { onSuccess: () => setBrokerDraft("") })}
            >
              {assignLead.isPending ? "Atribuindo…" : "Atribuir corretor"}
            </Button>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
