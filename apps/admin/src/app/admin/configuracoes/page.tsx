"use client";

import type { MatchWeightsInput } from "@spire/contracts";
import { Button, Card } from "@spire/ui-web";
import Link from "next/link";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import {
  usePlatformSettings,
  useUpdateCommissionRate,
  useUpdateDataRetentionDays,
  useUpdateDemandMatchThreshold,
  useUpdateMatchWeights,
  useUpdateRadarSweepInterval,
} from "@/hooks/use-settings";

const WEIGHT_LABELS: Record<keyof MatchWeightsInput, string> = {
  budget: "Orçamento",
  region: "Região/bairro",
  proximity: "Proximidade",
  area: "Metragem",
  roomsFeatures: "Quartos e características",
  purpose: "Finalidade (morar/investir)",
  payment: "Forma de pagamento",
  preferenceSignals: "Sinais de preferência (curtidas)",
};
const WEIGHT_KEYS = Object.keys(WEIGHT_LABELS) as (keyof MatchWeightsInput)[];

function MatchWeightsCard({ weights, isDefault }: { weights: MatchWeightsInput; isDefault: boolean }) {
  const [draft, setDraft] = useState<MatchWeightsInput>(weights);
  const [message, setMessage] = useState<string | null>(null);
  const update = useUpdateMatchWeights();

  const sum = WEIGHT_KEYS.reduce((acc, k) => acc + draft[k], 0);
  const sumPercent = Math.round(sum * 100);
  const sumValid = Math.abs(sum - 1) <= 0.01;

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg text-ink-primary">Pesos do Match Engine</h2>
      <p className="mt-1 text-bodySm text-ink-secondary">
        {isDefault ? "Usando os pesos padrão de fábrica." : "Pesos personalizados em uso."} Os 8 fatores precisam somar 100%.
      </p>

      <div className="mt-4 space-y-4">
        {WEIGHT_KEYS.map((key) => (
          <div key={key}>
            <div className="flex items-center justify-between text-bodySm">
              <span className="text-ink-secondary">{WEIGHT_LABELS[key]}</span>
              <span className="font-medium text-ink-primary">{Math.round(draft[key] * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(draft[key] * 100)}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value) / 100 }))}
              className="mt-1 w-full accent-brand-olive"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className={`text-bodySm font-medium ${sumValid ? "text-status-success" : "text-status-danger"}`}>Soma: {sumPercent}%</p>
        <Button
          size="sm"
          disabled={!sumValid || update.isPending}
          onClick={() => {
            setMessage(null);
            update.mutate(
              { weights: draft },
              {
                onSuccess: (res) => setMessage(`Salvo. Recálculo enfileirado para ${res.recalculationEnqueuedFor} comprador(es).`),
                onError: (err) => setMessage(err instanceof Error ? err.message : "Falha ao salvar"),
              },
            );
          }}
        >
          {update.isPending ? "Salvando..." : "Salvar pesos"}
        </Button>
      </div>
      {message && <p className="mt-2 text-caption text-ink-tertiary">{message}</p>}
    </Card>
  );
}

function CommissionRateCard({ rate }: { rate: number }) {
  const [draft, setDraft] = useState((rate * 100).toString());
  const update = useUpdateCommissionRate();

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg text-ink-primary">Comissão padrão</h2>
      <p className="mt-1 text-bodySm text-ink-secondary">Usada para calcular a comissão prevista quando um lead vira Ganho (Financeiro).</p>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={0.1}
          max={50}
          step={0.1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-10 w-24 rounded-xl border border-border-subtle bg-background-base px-3 text-bodyMd text-ink-primary"
        />
        <span className="text-bodySm text-ink-secondary">%</span>
        <Button
          size="sm"
          variant="outline"
          disabled={update.isPending || !draft}
          onClick={() => update.mutate({ rate: Number(draft) / 100 })}
        >
          Salvar
        </Button>
      </div>
      <p className="mt-2 text-caption text-ink-tertiary">Afeta só comissões novas — comissões já criadas mantêm a taxa do momento em que foram geradas.</p>
    </Card>
  );
}

function RadarIntervalCard({ minutes }: { minutes: number }) {
  const [draft, setDraft] = useState(minutes.toString());
  const update = useUpdateRadarSweepInterval();

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg text-ink-primary">Intervalo de varredura de radares</h2>
      <p className="mt-1 text-bodySm text-ink-secondary">
        Intervalo mínimo entre varreduras automáticas. Pode ser aumentado livremente; diminuir não tem efeito abaixo do ciclo
        fixo do worker em produção.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-10 w-24 rounded-xl border border-border-subtle bg-background-base px-3 text-bodyMd text-ink-primary"
        />
        <span className="text-bodySm text-ink-secondary">minutos</span>
        <Button size="sm" variant="outline" disabled={update.isPending || !draft} onClick={() => update.mutate({ minutes: Number(draft) })}>
          Salvar
        </Button>
      </div>
    </Card>
  );
}

function DemandMatchThresholdCard({ threshold }: { threshold: number }) {
  const [draft, setDraft] = useState(threshold.toString());
  const update = useUpdateDemandMatchThreshold();

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg text-ink-primary">Limiar do Demand Match</h2>
      <p className="mt-1 text-bodySm text-ink-secondary">
        Número mínimo de compradores compatíveis para revelar uma contagem ao time comercial — abaixo disso, o sistema mostra
        &quot;indisponível&quot; para não arriscar identificar compradores individuais.
      </p>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={2}
          max={100}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-10 w-24 rounded-xl border border-border-subtle bg-background-base px-3 text-bodyMd text-ink-primary"
        />
        <span className="text-bodySm text-ink-secondary">compradores</span>
        <Button size="sm" variant="outline" disabled={update.isPending || !draft} onClick={() => update.mutate({ threshold: Number(draft) })}>
          Salvar
        </Button>
      </div>
    </Card>
  );
}

function DataRetentionCard({ days }: { days: number }) {
  const [draft, setDraft] = useState(days.toString());
  const update = useUpdateDataRetentionDays();
  const years = (Number(draft || days) / 365).toFixed(1);

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg text-ink-primary">Prazo de retenção de dados (LGPD)</h2>
      <p className="mt-1 text-bodySm text-ink-secondary">
        Exibido em Privacidade como referência do tempo de guarda de dados pessoais. Hoje é só informativo — a purga automática
        ao fim do prazo ainda não existe (ver relatório de lacunas do Marco F).
      </p>
      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={30}
          max={3650}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-10 w-24 rounded-xl border border-border-subtle bg-background-base px-3 text-bodyMd text-ink-primary"
        />
        <span className="text-bodySm text-ink-secondary">dias (≈ {years} anos)</span>
        <Button size="sm" variant="outline" disabled={update.isPending || !draft} onClick={() => update.mutate({ days: Number(draft) })}>
          Salvar
        </Button>
      </div>
    </Card>
  );
}

export default function ConfiguracoesPage() {
  const { data, isLoading } = usePlatformSettings();

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Configurações</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">
        Regras de peso do Match Engine, comissão padrão e intervalo da fila. Papéis e permissões de usuários ficam em{" "}
        <Link href="/admin/usuarios" className="text-brand-olive hover:underline">
          Usuários
        </Link>
        .
      </p>

      {isLoading || !data ? (
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <MatchWeightsCard key={JSON.stringify(data.matchWeights)} weights={data.matchWeights} isDefault={data.matchWeightsIsDefault} />
          </div>
          <CommissionRateCard key={data.commissionDefaultRate} rate={data.commissionDefaultRate} />
          <RadarIntervalCard key={data.radarSweepIntervalMinutes} minutes={data.radarSweepIntervalMinutes} />
          <DemandMatchThresholdCard key={data.demandMatchThreshold} threshold={data.demandMatchThreshold} />
          <DataRetentionCard key={data.dataRetentionDays} days={data.dataRetentionDays} />
        </div>
      )}
    </AdminShell>
  );
}
