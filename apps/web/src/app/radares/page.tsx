"use client";

import type { PropertyType } from "@spire/contracts";
import { Button, Card, EmptyState, Input } from "@spire/ui-web";
import { Plus, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useCheckRadar, useCreateRadar, useRadars, useRemoveRadar } from "@/hooks/use-radars";

const TYPE_OPTIONS: { label: string; value: PropertyType | undefined }[] = [
  { label: "Todos", value: undefined },
  { label: "Apartamento", value: "APARTAMENTO" },
  { label: "Casa", value: "CASA" },
  { label: "Cobertura", value: "COBERTURA" },
];

function RadarForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [type, setType] = useState<PropertyType | undefined>(undefined);
  const createRadar = useCreateRadar();

  function submit() {
    if (!name.trim()) return;
    createRadar.mutate(
      {
        name: name.trim(),
        criteria: {
          neighborhoods: neighborhood.trim() ? [neighborhood.trim()] : [],
          priceMax: priceMax ? Number(priceMax) : undefined,
          type,
        },
      },
      {
        onSuccess: () => {
          setName("");
          setNeighborhood("");
          setPriceMax("");
          setType(undefined);
          onCreated();
        },
      },
    );
  }

  return (
    <Card className="mt-6 p-5">
      <h2 className="font-display text-lg text-ink-primary">Novo radar</h2>
      <div className="mt-3 space-y-3">
        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Nome do radar</label>
          <div className="mt-1.5">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Apê até R$ 1,5M em Boa Viagem" />
          </div>
        </div>
        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Bairro (opcional)</label>
          <div className="mt-1.5">
            <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Ex.: Boa Viagem" />
          </div>
        </div>
        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Preço máximo (opcional)</label>
          <div className="mt-1.5">
            <Input type="number" value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Ex.: 1500000" />
          </div>
        </div>
        <div>
          <label className="text-bodySm font-medium text-ink-secondary">Tipo</label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => setType(opt.value)}
                className={`rounded-pill px-4 py-1.5 text-bodySm font-medium ${
                  type === opt.value ? "bg-chip-activeBg text-chip-activeFg" : "bg-chip-inactiveBg text-chip-inactiveFg"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <Button className="w-full" disabled={!name.trim() || createRadar.isPending} onClick={submit}>
          <Plus className="h-4 w-4" />
          {createRadar.isPending ? "Criando…" : "Criar radar"}
        </Button>
      </div>
    </Card>
  );
}

export default function RadaresPage() {
  const { data, isLoading } = useRadars();
  const checkRadar = useCheckRadar();
  const removeRadar = useRemoveRadar();
  const [showForm, setShowForm] = useState(false);

  const items = data?.items ?? [];

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-ink-primary">Meus radares</h1>
          <Button size="sm" variant="secondary" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        </div>
        <p className="mt-1 text-bodySm text-ink-secondary">
          Buscas salvas que avisam quando um imóvel novo e compatível aparece no catálogo.
        </p>

        {showForm && <RadarForm onCreated={() => setShowForm(false)} />}

        {isLoading ? (
          <div className="mt-6 h-24 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : items.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="Nenhum radar criado ainda" description="Crie um radar para ser avisado sobre novos imóveis compatíveis." />
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {items.map((radar) => (
              <Card key={radar.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-bodyLg font-medium text-ink-primary">{radar.name}</p>
                    <p className="mt-0.5 text-caption text-ink-secondary">
                      {radar.criteria.neighborhoods.length > 0 && `${radar.criteria.neighborhoods.join(", ")} · `}
                      {radar.criteria.priceMax && `até R$ ${radar.criteria.priceMax.toLocaleString("pt-BR")} · `}
                      {radar.newMatchesCount} imóve{radar.newMatchesCount === 1 ? "l encontrado" : "is encontrados"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => checkRadar.mutate(radar.id)}
                      aria-label="Verificar agora"
                      disabled={checkRadar.isPending}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-background-subtle text-ink-primary"
                    >
                      <RefreshCw className={`h-4 w-4 ${checkRadar.isPending ? "animate-spin" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeRadar.mutate(radar.id)}
                      aria-label="Excluir radar"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-background-subtle text-status-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
