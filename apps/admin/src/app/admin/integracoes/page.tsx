"use client";

import type { IntegrationConnectionStatus, IntegrationDirection, IntegrationKey } from "@spire/contracts";
import { INTEGRATION_DIRECTIONS } from "@spire/contracts";
import { Button, Card, EmptyState } from "@spire/ui-web";
import { Bell, HardDrive, Mail, Map, MessageCircle, Plug, RefreshCw, Sparkles } from "lucide-react";
import { type ComponentType, useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import {
  useActivateIntegrationConnection,
  useCreateIntegrationConnection,
  useIntegrationConnections,
  usePauseIntegrationConnection,
  useRetryFailedIntegrationEvents,
} from "@/hooks/use-integration-connections";
import { useIntegrationsStatus } from "@/hooks/use-integrations-status";

const ICONS: Record<IntegrationKey, ComponentType<{ className?: string }>> = {
  maps: Map,
  storage: HardDrive,
  smtp: Mail,
  whatsapp: MessageCircle,
  llm: Sparkles,
  webPush: Bell,
};

const CONNECTION_STATUS_LABEL: Record<IntegrationConnectionStatus, string> = {
  PENDENTE: "Pendente",
  ATIVA: "Ativa",
  PAUSADA: "Pausada",
};

const CONNECTION_STATUS_STYLE: Record<IntegrationConnectionStatus, string> = {
  PENDENTE: "bg-background-subtle text-ink-tertiary",
  ATIVA: "bg-status-successBg text-status-success",
  PAUSADA: "bg-status-warmBg text-status-warm",
};

function NewConnectionForm() {
  const [provider, setProvider] = useState("");
  const [label, setLabel] = useState("");
  const [direction, setDirection] = useState<IntegrationDirection>("AMBAS");
  const create = useCreateIntegrationConnection();

  const submit = () => {
    if (!provider.trim() || !label.trim()) return;
    create.mutate(
      { provider: provider.trim(), label: label.trim(), direction, config: {} },
      { onSuccess: () => { setProvider(""); setLabel(""); } },
    );
  };

  return (
    <Card className="p-5">
      <h2 className="font-display text-lg text-ink-primary">Nova conexão externa</h2>
      <p className="mt-1 text-bodySm text-ink-secondary">
        Cria a conexão desativada (PENDENTE) — sem credencial real configurada, nada é enviado/recebido de fato até um conector específico existir.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <input
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          placeholder="Provedor (ex.: portal-x)"
          className="h-10 rounded-xl border border-border-subtle bg-background-base px-3 text-bodyMd text-ink-primary sm:col-span-1"
        />
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Nome de exibição"
          className="h-10 rounded-xl border border-border-subtle bg-background-base px-3 text-bodyMd text-ink-primary sm:col-span-1"
        />
        <select
          value={direction}
          onChange={(e) => setDirection(e.target.value as IntegrationDirection)}
          className="h-10 rounded-xl border border-border-subtle bg-background-base px-3 text-bodyMd text-ink-primary sm:col-span-1"
        >
          {INTEGRATION_DIRECTIONS.map((d) => (
            <option key={d} value={d}>
              {d === "ENTRADA" ? "Entrada" : d === "SAIDA" ? "Saída" : "Ambas"}
            </option>
          ))}
        </select>
        <Button size="sm" disabled={create.isPending} onClick={submit} className="sm:col-span-1">
          Criar conexão
        </Button>
      </div>
    </Card>
  );
}

function ConnectionsSection() {
  const { data, isLoading } = useIntegrationConnections();
  const activate = useActivateIntegrationConnection();
  const pause = usePauseIntegrationConnection();
  const retryFailed = useRetryFailedIntegrationEvents();
  const items = data?.items ?? [];
  const totalFailed = items.reduce((acc, item) => acc + item.failedEventsCount, 0);

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl text-ink-primary">Conexões externas</h2>
          <p className="mt-1 text-bodyMd text-ink-secondary">
            Fundação de integrações (leads externos, publicação de anúncios, catálogo licenciado) — cada conexão isola suas próprias credenciais, status e histórico de eventos.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={retryFailed.isPending || totalFailed === 0}
          onClick={() => retryFailed.mutate()}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          Reprocessar falhas ({totalFailed})
        </Button>
      </div>

      <div className="mt-4">
        <NewConnectionForm />
      </div>

      {isLoading ? (
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
      ) : items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Nenhuma conexão cadastrada"
            description="Crie uma conexão acima para começar a preparar a integração com uma fonte externa."
            icon={<Plug className="h-8 w-8" aria-hidden />}
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((connection) => (
            <Card key={connection.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base text-ink-primary">{connection.label}</h3>
                  <p className="text-caption uppercase tracking-wide text-ink-tertiary">{connection.provider}</p>
                </div>
                <span className={`rounded-pill px-2.5 py-1 text-caption font-semibold uppercase tracking-wide ${CONNECTION_STATUS_STYLE[connection.status]}`}>
                  {CONNECTION_STATUS_LABEL[connection.status]}
                </span>
              </div>
              <p className="mt-3 text-bodySm text-ink-secondary">
                {connection.pendingEventsCount} evento(s) pendente(s) · {connection.failedEventsCount} falha(s)
              </p>
              {connection.lastErrorMessage && (
                <p className="mt-2 text-bodySm text-status-danger">Último erro: {connection.lastErrorMessage}</p>
              )}
              <div className="mt-4 flex gap-2">
                {connection.status === "ATIVA" ? (
                  <Button size="sm" variant="outline" disabled={pause.isPending} onClick={() => pause.mutate(connection.id)}>
                    Pausar
                  </Button>
                ) : (
                  <Button size="sm" disabled={activate.isPending} onClick={() => activate.mutate(connection.id)}>
                    Ativar
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export default function IntegracoesPage() {
  const { data, isLoading } = useIntegrationsStatus();
  const items = data?.items ?? [];

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Integrações</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">Status de mapas, storage, SMTP, WhatsApp e LLM — mostra claramente o que está pendente de credencial.</p>

      {isLoading ? (
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
      ) : items.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="Nada para mostrar" description="Nenhuma integração configurada no servidor." />
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const Icon = ICONS[item.key];
            const active = item.status === "ATIVO";
            return (
              <Card key={item.key} className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-ink-secondary" aria-hidden />
                    <h2 className="font-display text-lg text-ink-primary">{item.label}</h2>
                  </div>
                  <span
                    className={`rounded-pill px-2.5 py-1 text-caption font-semibold uppercase tracking-wide ${
                      active ? "bg-status-successBg text-status-success" : "bg-background-subtle text-ink-tertiary"
                    }`}
                  >
                    {active ? "Ativo" : "Pendente"}
                  </span>
                </div>
                <p className="mt-3 text-bodySm text-ink-secondary">{item.description}</p>
              </Card>
            );
          })}
        </div>
      )}

      <ConnectionsSection />
    </AdminShell>
  );
}
