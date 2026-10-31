"use client";

import type { Partner, PartnerCategory } from "@spire/contracts";
import { Button, EmptyState, Input } from "@spire/ui-web";
import { Plus } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useAdminPartners, useCreatePartner, useDeletePartner, useUpdatePartner } from "@/hooks/use-partners";

const CATEGORY_LABELS: Record<PartnerCategory, string> = {
  FINANCIAMENTO: "Financiamento",
  SEGUROS: "Seguros",
  ARQUITETURA: "Arquitetura",
  REFORMA: "Reforma",
  OUTRO: "Outro",
};

interface PartnerFormState {
  name: string;
  category: PartnerCategory;
  description: string;
  ctaUrl: string;
  ctaLabel: string;
  termsUrl: string;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

function toFormState(partner?: Partner): PartnerFormState {
  return {
    name: partner?.name ?? "",
    category: partner?.category ?? "FINANCIAMENTO",
    description: partner?.description ?? "",
    ctaUrl: partner?.ctaUrl ?? "",
    ctaLabel: partner?.ctaLabel ?? "",
    termsUrl: partner?.termsUrl ?? "",
    validFrom: partner?.validFrom ?? "",
    validUntil: partner?.validUntil ?? "",
    active: partner?.active ?? true,
  };
}

export default function ParceirosPage() {
  const { data, isLoading } = useAdminPartners();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState<PartnerFormState>(() => toFormState());
  const [error, setError] = useState<string | null>(null);

  const createPartner = useCreatePartner();
  const updatePartner = useUpdatePartner(editing?.id ?? "");
  const deletePartner = useDeletePartner();

  const partners = data?.items ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(toFormState());
    setFormOpen(true);
  };
  const openEdit = (partner: Partner) => {
    setEditing(partner);
    setForm(toFormState(partner));
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setError(null);
  };

  const set = <K extends keyof PartnerFormState>(key: K, value: PartnerFormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim()) {
      setError("Informe nome e descrição do parceiro.");
      return;
    }
    setError(null);
    const payload = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      ctaUrl: form.ctaUrl.trim() || null,
      ctaLabel: form.ctaLabel.trim() || null,
      termsUrl: form.termsUrl.trim() || null,
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
      active: form.active,
    };
    const onSuccess = () => closeForm();
    const onError = () => setError("Não foi possível salvar o parceiro — verifique os links informados.");
    if (editing) {
      updatePartner.mutate(payload, { onSuccess, onError });
    } else {
      createPartner.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-primary">Parceiros</h1>
          <p className="mt-1 text-bodyMd text-ink-secondary">Diretório do Club — financiamento, seguros, arquitetura e reforma.</p>
        </div>
        {!formOpen && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            Novo parceiro
          </Button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-border-subtle bg-background-elevated p-5">
          <h2 className="font-display text-lg text-ink-primary">{editing ? "Editar parceiro" : "Novo parceiro"}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Nome</span>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Categoria</span>
              <select
                value={form.category}
                onChange={(e) => set("category", e.target.value as PartnerCategory)}
                className="h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
              >
                {(Object.entries(CATEGORY_LABELS) as [PartnerCategory, string][]).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Link (opcional)</span>
              <Input value={form.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} placeholder="https://…" />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Texto do botão (opcional)</span>
              <Input value={form.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="Ex.: Simular financiamento" />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Link dos termos (opcional)</span>
              <Input value={form.termsUrl} onChange={(e) => set("termsUrl", e.target.value)} placeholder="https://…" />
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 rounded border-border-strong" />
              <span className="text-bodySm text-ink-secondary">Ativo</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Válido a partir de (opcional)</span>
              <Input type="date" value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Válido até (opcional)</span>
              <Input type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-bodySm text-ink-secondary">Descrição</span>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-border-subtle bg-background-elevated p-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
            />
          </label>
          {error && <p className="text-bodySm text-status-danger">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={createPartner.isPending || updatePartner.isPending}>
              {createPartner.isPending || updatePartner.isPending ? "Salvando…" : editing ? "Salvar alterações" : "Criar parceiro"}
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
        ) : partners.length === 0 ? (
          <EmptyState title="Nenhum parceiro cadastrado" description="Cadastre parceiros reais para compor o diretório do Club." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Parceiro</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Vigência</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-background-subtle">
                    <td className="px-4 py-3 font-medium text-ink-primary">{partner.name}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{CATEGORY_LABELS[partner.category]}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">
                      {!partner.validFrom && !partner.validUntil
                        ? "Sem limite"
                        : `${partner.validFrom ?? "início indefinido"} até ${partner.validUntil ?? "sem limite"}`}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-pill px-2.5 py-1 text-caption font-medium ${
                          partner.active ? "bg-status-successBg text-status-success" : "bg-background-subtle text-ink-tertiary"
                        }`}
                      >
                        {partner.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => openEdit(partner)} className="text-bodySm font-medium text-brand-olive hover:underline">
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePartner.mutate(partner.id)}
                          disabled={deletePartner.isPending}
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
