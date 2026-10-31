"use client";

import type { OwnerLeadStage } from "@spire/contracts";
import { Button, Card } from "@spire/ui-web";
import { FileText, Home, Sparkles, StickyNote, UserCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { DemandMatchWidget } from "@/components/owner-leads/DemandMatchWidget";
import { PrivateMarketOfferCard } from "@/components/owner-leads/PrivateMarketOfferCard";
import { useBrokers } from "@/hooks/use-admin-brokers";
import {
  useAddOwnerLeadNote,
  useAssignOwnerLead,
  useOwnerLeadDetail,
  usePublishOwnerLead,
  useUpdateOwnerLeadStage,
} from "@/hooks/use-owner-leads";
import { OWNER_LEAD_INTENT_LABELS, OWNER_LEAD_STAGE_LABELS } from "@/lib/owner-lead-labels";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const ACTIVITY_ICONS = {
  CREATED: Sparkles,
  STAGE_CHANGED: FileText,
  ASSIGNED: UserPlus,
  NOTE: StickyNote,
  PUBLISHED: Home,
} as const;

export default function OwnerLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: ownerLead, isLoading } = useOwnerLeadDetail(id);
  const { data: brokersData } = useBrokers();
  const updateStage = useUpdateOwnerLeadStage(id);
  const assignOwnerLead = useAssignOwnerLead(id);
  const addNote = useAddOwnerLeadNote(id);
  const publish = usePublishOwnerLead(id);

  const [stageDraft, setStageDraft] = useState<OwnerLeadStage | "">("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [brokerDraft, setBrokerDraft] = useState("");
  const [note, setNote] = useState("");
  const [publishPrice, setPublishPrice] = useState("");
  const [stageError, setStageError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  const brokers = brokersData?.items ?? [];
  const currentStage = stageDraft || ownerLead?.stage || "";

  if (isLoading || !ownerLead) {
    return (
      <AdminShell>
        <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
      </AdminShell>
    );
  }

  const handleSaveStage = async () => {
    if (!stageDraft || stageDraft === ownerLead.stage) return;
    setStageError(null);
    try {
      await updateStage.mutateAsync({ stage: stageDraft, rejectionReason: stageDraft === "REJEITADO" ? rejectionReason.trim() : undefined });
      setStageDraft("");
      setRejectionReason("");
    } catch {
      setStageError(
        stageDraft === "REJEITADO" ? "Informe o motivo da rejeição para concluir esta mudança de estágio." : "Não foi possível atualizar o estágio.",
      );
    }
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div>
            <h1 className="font-display text-2xl text-ink-primary">{ownerLead.owner.name}</h1>
            <p className="text-bodySm text-ink-secondary">{ownerLead.owner.email}</p>
          </div>

          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-bodySm text-ink-secondary">Imóvel</p>
                <p className="text-bodyMd text-ink-primary">
                  {ownerLead.neighborhood}, {ownerLead.city} — {ownerLead.areaSqm} m², {ownerLead.bedrooms} qts, {ownerLead.parkingSpaces} vagas
                </p>
              </div>
              <div>
                <p className="text-bodySm text-ink-secondary">Intenção</p>
                <p className="text-bodyMd text-ink-primary">{OWNER_LEAD_INTENT_LABELS[ownerLead.intent]}</p>
              </div>
              <div>
                <p className="text-bodySm text-ink-secondary">Preço pretendido</p>
                <p className="text-bodyMd text-ink-primary">{ownerLead.askingPrice ? currencyFormatter.format(ownerLead.askingPrice) : "Não informado"}</p>
              </div>
              {ownerLead.rejectionReason && (
                <div>
                  <p className="text-bodySm text-ink-secondary">Motivo da rejeição</p>
                  <p className="text-bodyMd text-status-danger">{ownerLead.rejectionReason}</p>
                </div>
              )}
            </div>
            {ownerLead.description && <p className="mt-3 text-bodySm text-ink-secondary">{ownerLead.description}</p>}
          </Card>

          <DemandMatchWidget ownerLead={ownerLead} />

          <PrivateMarketOfferCard ownerLeadId={ownerLead.id} />

          {ownerLead.stage === "APROVADO" && (
            <Card className="border-status-success/30 bg-status-successBg/40 p-5">
              <h2 className="font-display text-lg text-ink-primary">Publicar no catálogo</h2>
              <p className="mt-1 text-bodySm text-ink-secondary">
                Cria um imóvel rascunho no catálogo (Imóveis) a partir destes dados — ainda precisa ser revisado e publicado como
                disponível antes de aparecer para compradores.
              </p>
              {!ownerLead.askingPrice && (
                <input
                  type="number"
                  value={publishPrice}
                  onChange={(e) => setPublishPrice(e.target.value)}
                  placeholder="Preço (obrigatório — proprietário não informou)"
                  className="mt-3 h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:border-brand-olive focus:outline-none"
                />
              )}
              {publishError && <p className="mt-2 text-bodySm text-status-danger">{publishError}</p>}
              <Button
                className="mt-3"
                size="sm"
                disabled={publish.isPending}
                onClick={async () => {
                  setPublishError(null);
                  try {
                    await publish.mutateAsync(publishPrice ? { price: Number(publishPrice) } : {});
                  } catch {
                    setPublishError("Não foi possível publicar — confira se há um preço informado.");
                  }
                }}
              >
                {publish.isPending ? "Publicando…" : "Publicar no catálogo"}
              </Button>
            </Card>
          )}

          {ownerLead.linkedPropertyId && (
            <Card className="p-5">
              <h2 className="flex items-center gap-2 font-display text-lg text-ink-primary">
                <Home className="h-4 w-4" aria-hidden />
                Imóvel vinculado
              </h2>
              <Link href="/admin/imoveis" className="mt-1 inline-block text-bodySm font-medium text-brand-olive hover:underline">
                Ver no catálogo de Imóveis
              </Link>
            </Card>
          )}

          <Card className="p-5">
            <h2 className="font-display text-lg text-ink-primary">Linha do tempo</h2>
            <ol className="mt-4 space-y-4">
              {ownerLead.activities.map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type];
                return (
                  <li key={activity.id} className="flex gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background-subtle text-ink-secondary">
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>
                    <div>
                      <p className="text-bodyMd text-ink-primary">{activity.description}</p>
                      <p className="text-caption text-ink-tertiary">
                        {new Date(activity.createdAt).toLocaleString("pt-BR", { timeZone: "America/Recife", dateStyle: "medium", timeStyle: "short" })}
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
              placeholder="Registre uma observação sobre esta captação…"
              rows={3}
              className="mt-3 w-full rounded-xl border border-border-subtle bg-background-elevated p-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:border-brand-olive focus:outline-none"
            />
            <Button className="mt-3" size="sm" disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate({ note: note.trim() }, { onSuccess: () => setNote("") })}>
              {addNote.isPending ? "Salvando…" : "Adicionar nota"}
            </Button>
          </Card>
        </div>

        <div className="w-full space-y-6 lg:w-80">
          <Card className="p-5">
            <h2 className="font-display text-lg text-ink-primary">Estágio da captação</h2>
            <select
              value={currentStage}
              onChange={(e) => setStageDraft(e.target.value as OwnerLeadStage)}
              disabled={ownerLead.stage === "CONVERTIDO"}
              className="mt-3 h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
            >
              {(Object.entries(OWNER_LEAD_STAGE_LABELS) as Array<[OwnerLeadStage, string]>).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            {stageDraft === "REJEITADO" && (
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Motivo da rejeição (obrigatório)"
                rows={2}
                className="mt-3 w-full rounded-xl border border-border-subtle bg-background-elevated p-3 text-bodyMd text-ink-primary placeholder:text-ink-tertiary focus:border-brand-olive focus:outline-none"
              />
            )}
            {stageError && <p className="mt-2 text-bodySm text-status-danger">{stageError}</p>}

            <Button className="mt-3 w-full" size="sm" disabled={!stageDraft || stageDraft === ownerLead.stage || updateStage.isPending || ownerLead.stage === "CONVERTIDO"} onClick={handleSaveStage}>
              {updateStage.isPending ? "Salvando…" : "Salvar estágio"}
            </Button>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-ink-primary">
              <UserCheck className="h-4 w-4" aria-hidden />
              Corretor responsável
            </h2>
            <p className="mt-1 text-bodySm text-ink-secondary">{ownerLead.assignedBroker?.name ?? "Não atribuído"}</p>
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
              disabled={!brokerDraft || assignOwnerLead.isPending}
              onClick={() => assignOwnerLead.mutate({ brokerId: brokerDraft }, { onSuccess: () => setBrokerDraft("") })}
            >
              {assignOwnerLead.isPending ? "Atribuindo…" : "Atribuir corretor"}
            </Button>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}
