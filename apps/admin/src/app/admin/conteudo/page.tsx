"use client";

import type { MarketIndicator } from "@spire/contracts";
import { Button, EmptyState, Input } from "@spire/ui-web";
import { Plus } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useCreateMarketIndicator, useDeleteMarketIndicator, useMarketIndicators, useUpdateMarketIndicator } from "@/hooks/use-market-indicators";

interface IndicatorFormState {
  title: string;
  value: string;
  unit: string;
  region: string;
  period: string;
  source: string;
  methodology: string;
  active: boolean;
}

function toFormState(indicator?: MarketIndicator): IndicatorFormState {
  return {
    title: indicator?.title ?? "",
    value: indicator?.value !== undefined ? String(indicator.value) : "",
    unit: indicator?.unit ?? "",
    region: indicator?.region ?? "",
    period: indicator?.period ?? "",
    source: indicator?.source ?? "",
    methodology: indicator?.methodology ?? "",
    active: indicator?.active ?? true,
  };
}

export default function ConteudoPage() {
  const { data, isLoading } = useMarketIndicators();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MarketIndicator | null>(null);
  const [form, setForm] = useState<IndicatorFormState>(() => toFormState());
  const [error, setError] = useState<string | null>(null);

  const createIndicator = useCreateMarketIndicator();
  const updateIndicator = useUpdateMarketIndicator(editing?.id ?? "");
  const deleteIndicator = useDeleteMarketIndicator();

  const indicators = data?.items ?? [];

  const openCreate = () => {
    setEditing(null);
    setForm(toFormState());
    setFormOpen(true);
  };
  const openEdit = (indicator: MarketIndicator) => {
    setEditing(indicator);
    setForm(toFormState(indicator));
    setFormOpen(true);
  };
  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
    setError(null);
  };

  const set = <K extends keyof IndicatorFormState>(key: K, value: IndicatorFormState[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.value || !form.unit.trim() || !form.region.trim() || !form.period.trim() || !form.source.trim() || !form.methodology.trim()) {
      setError("Todos os campos são obrigatórios — nunca publicar um número sem fonte, período e metodologia.");
      return;
    }
    setError(null);
    const payload = {
      title: form.title.trim(),
      value: Number(form.value),
      unit: form.unit.trim(),
      region: form.region.trim(),
      period: form.period.trim(),
      source: form.source.trim(),
      methodology: form.methodology.trim(),
      active: form.active,
    };
    const onSuccess = () => closeForm();
    const onError = () => setError("Não foi possível salvar o indicador.");
    if (editing) {
      updateIndicator.mutate(payload, { onSuccess, onError });
    } else {
      createIndicator.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-primary">Conteúdo</h1>
          <p className="mt-1 text-bodyMd text-ink-secondary">
            Indicadores de mercado do Pulse — fonte, período e metodologia sempre declarados, nunca um número fabricado.
          </p>
        </div>
        {!formOpen && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4" aria-hidden />
            Novo indicador
          </Button>
        )}
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl border border-border-subtle bg-background-elevated p-5">
          <h2 className="font-display text-lg text-ink-primary">{editing ? "Editar indicador" : "Novo indicador"}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Título</span>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ex.: Valorização média" />
            </label>
            <label className="block sm:col-span-2 sm:grid sm:grid-cols-[1fr_1fr] sm:gap-4">
              <span className="mb-1 block text-bodySm text-ink-secondary sm:col-span-2">Valor e unidade</span>
              <Input type="number" value={form.value} onChange={(e) => set("value", e.target.value)} placeholder="Valor" />
              <Input value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="Unidade (ex.: %, R$/m²)" />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Região</span>
              <Input value={form.region} onChange={(e) => set("region", e.target.value)} placeholder="Ex.: Boa Viagem, Recife" />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Período</span>
              <Input value={form.period} onChange={(e) => set("period", e.target.value)} placeholder="Ex.: 1º trimestre de 2026" />
            </label>
            <label className="block">
              <span className="mb-1 block text-bodySm text-ink-secondary">Fonte</span>
              <Input value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="Ex.: FipeZap, CRECI-PE" />
            </label>
            <label className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 rounded border-border-strong" />
              <span className="text-bodySm text-ink-secondary">Ativo (visível no Pulse)</span>
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-bodySm text-ink-secondary">Metodologia</span>
            <textarea
              value={form.methodology}
              onChange={(e) => set("methodology", e.target.value)}
              rows={3}
              placeholder="Como este número foi calculado — explicado para o comprador"
              className="w-full rounded-xl border border-border-subtle bg-background-elevated p-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
            />
          </label>
          {error && <p className="text-bodySm text-status-danger">{error}</p>}
          <div className="flex gap-3">
            <Button type="submit" disabled={createIndicator.isPending || updateIndicator.isPending}>
              {createIndicator.isPending || updateIndicator.isPending ? "Salvando…" : editing ? "Salvar alterações" : "Criar indicador"}
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
        ) : indicators.length === 0 ? (
          <EmptyState title="Nenhum indicador cadastrado" description="Cadastre indicadores reais com fonte declarada para alimentar o Pulse." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Indicador</th>
                  <th className="px-4 py-3">Região</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Fonte</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {indicators.map((indicator) => (
                  <tr key={indicator.id} className="hover:bg-background-subtle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-primary">{indicator.title}</p>
                      <p className="text-caption text-ink-tertiary">
                        {indicator.value} {indicator.unit}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{indicator.region}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{indicator.period}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{indicator.source}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-pill px-2.5 py-1 text-caption font-medium ${
                          indicator.active ? "bg-status-successBg text-status-success" : "bg-background-subtle text-ink-tertiary"
                        }`}
                      >
                        {indicator.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => openEdit(indicator)} className="text-bodySm font-medium text-brand-olive hover:underline">
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteIndicator.mutate(indicator.id)}
                          disabled={deleteIndicator.isPending}
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
