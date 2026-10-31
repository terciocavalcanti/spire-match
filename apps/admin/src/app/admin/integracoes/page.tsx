"use client";

import type { IntegrationKey } from "@spire/contracts";
import { Card, EmptyState } from "@spire/ui-web";
import { Bell, HardDrive, Mail, Map, MessageCircle, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useIntegrationsStatus } from "@/hooks/use-integrations-status";

const ICONS: Record<IntegrationKey, ComponentType<{ className?: string }>> = {
  maps: Map,
  storage: HardDrive,
  smtp: Mail,
  whatsapp: MessageCircle,
  llm: Sparkles,
  webPush: Bell,
};

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
    </AdminShell>
  );
}
