"use client";

import type { Campaign, CampaignStatus, CampaignType } from "@spire/contracts";
import { Button, EmptyState, Input } from "@spire/ui-web";
import { Plus } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useAdminDevelopments } from "@/hooks/use-admin-developments";
import { useCampaignStats, useCampaigns, useCreateCampaign, useDeleteCampaign, useUpdateCampaign } from "@/hooks/use-campaigns";

const TYPE_LABELS: Record<CampaignType, string> = {
  LANCAMENTO: "Lançamento",
  INSTITUCIONAL: "Institucional",
  PERFORMANCE: "Performance",
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  RASCUNHO: "Rascunho",
  ATIVA: "Ativa",
  PAUSADA: "Pausada",
  ENCERRADA: "Encerrada",
};

const STATUS_CLASSES: Record<CampaignStatus, string> = {
  RASCUNHO: "bg-background-subtle text-ink-tertiary",
  ATIVA: "bg-status-successBg text-status-success",
  PAUSADA: "bg-status-warmBg text-status-warm",
  ENCERRADA: "bg-background-subtle text-ink-tertiary",
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

interface CampaignFormState {
  name: string;
  type: CampaignType;
  channel: string;
  sponsorName: string;
  developmentId: string;
  startDate: string;
  endDate: string;
  budget: string;
  goalDescription: string;
  status: CampaignStatus;
}

function toFormState(campaign?: Campaign): CampaignFormState {
  return {
    name: campaign?.name ?? "",
    type: campaign?.type ?? "LANCAMENTO",
    channel: campaign?.channel ?? "",
    sponsorName: campaign?.sponsorName ?? "",
    developmentId: campaign?.developmentId ?? "",
    startDate: campaign?.startDate ?? "",
    endDate: campaign?.endDate ?? "",
    budget: campaign?.budget ? String(campaign.budget) : "",
    goalDescription: campaign?.goalDescription ?? "",
    status: campaign?.status ?? "RASCUNHO",
  };
}

function StatsCell({ campaignId, hasDevelopment }: { campaignId: string; hasDevelopment: boolean }) {
  const { data, isLoading } = useCampaignStats(campaignId);
  if (!hasDevelopment) return <span className="text-bodySm text-ink-tertiary">—</span>;
  if (isLoading || !data) return <span className="text-bodySm text-ink-tertiary">…</span>;
  if (data.linkedPropertiesCount === 0) return <span className="text-caption text-ink-tertiary">Sem unidade vinculada</span>;
  return (
    <span className="text-bodySm text-ink-secondary">
      {data.leadsCount} leads · {data.wonCount} vendas · {currencyFormatter.format(data.vgv)}
    </span>
  );
}

export default function CampanhasPage() {
  const { data, isLoading } = useCampaigns({ limit: 100 });
  const { data: developmentsData } = useAdminDevelopments({ limit: 100 });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [form, setForm] = useState<CampaignFormState>(() => toFormState());
  const [error, setError] = useState<string | null>(null);

  const createCampaign = useCreateCampaign();
  const updateCampaign = useUpdateCampaign(editing?.id ?? "");
  const deleteCampaign = useDeleteCampaign();

  const campaigns = data?.items ?? [];
  const developments = developmentsData?.items ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(toFormState());
    setFormOpen(true);
  };
  const openEdit = (campaign: Campaign) => {
    setEditing(campaign);
    setForm(toFormState(campaign));
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setError(null);
  };

  const set = <K extends keyof CampaignFormState>(key: K, value: CampaignFormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.channel.trim() || !form.startDate) {
      setError("Informe nome, canal e data de início.");
      return;
    }
    setError(null);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      channel: form.channel.trim(),
      sponsorName: form.sponsorName.trim() || null,
      developmentId: form.developmentId || null,
      startDate: form.startDate,
      endDate: form.endDate || null,
      budget: form.budget ? Number(form.budget) : null,
      goalDescription: form.goalDescription.trim() || null,
      status: form.status,
    };
    const onSuccess = () => closeForm();
    const onError = () => setError("Não foi possível salvar a campanha.");
    if (editing) {
      updateCampaign.mutate(payload, { onSuccess, onError });
    } else {
      createCampaign.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-primary">Campanhas</h1>
          <p className="mt-1 text-bodyMd text-ink-secondary">Campanhas de incorporadoras e parcerias, com período, verba e resultados.</p>
        </div>
        {!formOpen && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            Nova campanha
          </Button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-border-subtle bg-background-elevated p-5">
          <h2 className="font-display text-lg text-ink-primary">{editing ? "Editar campanha" : "Nova campanha"}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Nome</span>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Canal</span>
              <Input value={form.channel} onChange={(e) => set("channel", e.target.value)} placeholder="Ex.: Meta Ads, Google Ads, feirão" />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Tipo</span>
              <select
                value={form.type}
                onChange={(e) => set("type", e.target.value as CampaignType)}
                className="h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
              >
                {(Object.entries(TYPE_LABELS) as [CampaignType, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Status</span>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as CampaignStatus)}
                className="h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
              >
                {(Object.entries(STATUS_LABELS) as [CampaignStatus, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Empreendimento (opcional)</span>
              <select
                value={form.developmentId}
                onChange={(e) => set("developmentId", e.target.value)}
                className="h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
              >
                <option value="">Nenhum</option>
                {developments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Patrocinador (opcional)</span>
              <Input value={form.sponsorName} onChange={(e) => set("sponsorName", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Início</span>
              <Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Fim (opcional)</span>
              <Input type="date" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Verba (opcional)</span>
              <Input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-bodySm text-ink-secondary">Objetivo (opcional)</span>
            <textarea
              value={form.goalDescription}
              onChange={(e) => set("goalDescription", e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border-subtle bg-background-elevated p-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
            />
          </label>
          {error && <p className="text-bodySm text-status-danger">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={createCampaign.isPending || updateCampaign.isPending}>
              {createCampaign.isPending || updateCampaign.isPending ? "Salvando…" : editing ? "Salvar alterações" : "Criar campanha"}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : campaigns.length === 0 ? (
          <EmptyState title="Nenhuma campanha cadastrada" description="Crie campanhas para acompanhar período, verba e resultados por empreendimento." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Campanha</th>
                  <th className="px-4 py-3">Empreendimento</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Resultados</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-background-subtle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-primary">{campaign.name}</p>
                      <p className="text-caption text-ink-tertiary">
                        {TYPE_LABELS[campaign.type]} · {campaign.channel}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{campaign.developmentName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-pill px-2.5 py-1 text-caption font-medium ${STATUS_CLASSES[campaign.status]}`}>
                        {STATUS_LABELS[campaign.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatsCell campaignId={campaign.id} hasDevelopment={!!campaign.developmentId} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => openEdit(campaign)} className="text-bodySm font-medium text-brand-olive hover:underline">
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCampaign.mutate(campaign.id)}
                          disabled={deleteCampaign.isPending}
                          className="text-bodySm font-medium text-status-danger hover:underline"
                        >
                          Excluir
                        </button>
                      </div>
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
