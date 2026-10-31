"use client";

import type { AutomationRule, LeadAutoAssignConfig, SlaReminderConfig } from "@spire/contracts";
import { Button, Card } from "@spire/ui-web";
import { Play } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useBrokers } from "@/hooks/use-admin-brokers";
import { useAutomations, useRunAutomation, useUpdateAutomation } from "@/hooks/use-automations";

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function EnabledToggle({ enabled, onChange }: { enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative h-6 w-11 rounded-pill transition-colors ${enabled ? "bg-brand-olive" : "bg-background-subtle"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function LastRunInfo({ rule }: { rule: AutomationRule }) {
  if (!rule.lastRunAt) return <p className="text-caption text-ink-tertiary">Nunca executada.</p>;
  return (
    <p className="text-caption text-ink-tertiary">
      Última execução: {dateTimeFormatter.format(new Date(rule.lastRunAt))} — {rule.lastRunCount ?? 0} registro(s) afetado(s)
    </p>
  );
}

function LeadAutoAssignCard({ rule }: { rule: AutomationRule }) {
  const config = rule.config as Partial<LeadAutoAssignConfig>;
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>(config.brokerIds ?? []);
  const { data: brokersData } = useBrokers();
  const update = useUpdateAutomation();
  const run = useRunAutomation();

  const toggleBroker = (id: string) => {
    const next = selectedBrokers.includes(id) ? selectedBrokers.filter((b) => b !== id) : [...selectedBrokers, id];
    setSelectedBrokers(next);
    update.mutate({ type: "LEAD_AUTO_ASSIGN", payload: { enabled: rule.enabled, config: { brokerIds: next } } });
  };

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg text-ink-primary">Distribuição automática de leads</h2>
          <p className="mt-1 text-bodySm text-ink-secondary">
            Atribui leads novos sem corretor, em rodízio (round-robin), entre os corretores selecionados.
          </p>
        </div>
        <EnabledToggle
          enabled={rule.enabled}
          onChange={(enabled) => update.mutate({ type: "LEAD_AUTO_ASSIGN", payload: { enabled, config: { brokerIds: selectedBrokers } } })}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {(brokersData?.items ?? []).map((broker) => (
          <label key={broker.id} className="flex items-center gap-1.5 text-bodySm text-ink-secondary">
            <input type="checkbox" checked={selectedBrokers.includes(broker.id)} onChange={() => toggleBroker(broker.id)} className="h-4 w-4 rounded border-border-strong" />
            {broker.name}
          </label>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <LastRunInfo rule={rule} />
        <Button size="sm" variant="outline" disabled={run.isPending || !rule.enabled} onClick={() => run.mutate("LEAD_AUTO_ASSIGN")}>
          <Play className="h-4 w-4" aria-hidden />
          Rodar agora
        </Button>
      </div>
    </Card>
  );
}

function SlaReminderCard({ rule }: { rule: AutomationRule }) {
  const config = rule.config as Partial<SlaReminderConfig>;
  const [hours, setHours] = useState((config.hoursThreshold ?? 24).toString());
  const update = useUpdateAutomation();
  const run = useRunAutomation();

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-lg text-ink-primary">Lembrete de SLA</h2>
          <p className="mt-1 text-bodySm text-ink-secondary">Avisa o time comercial quando um lead fica parado sem atividade.</p>
        </div>
        <EnabledToggle
          enabled={rule.enabled}
          onChange={(enabled) => update.mutate({ type: "SLA_REMINDER", payload: { enabled, config: { hoursThreshold: Number(hours) || 24 } } })}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          onBlur={() => update.mutate({ type: "SLA_REMINDER", payload: { enabled: rule.enabled, config: { hoursThreshold: Number(hours) || 24 } } })}
          className="h-10 w-24 rounded-xl border border-border-subtle bg-background-base px-3 text-bodyMd text-ink-primary"
        />
        <span className="text-bodySm text-ink-secondary">horas sem atividade</span>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <LastRunInfo rule={rule} />
        <Button size="sm" variant="outline" disabled={run.isPending || !rule.enabled} onClick={() => run.mutate("SLA_REMINDER")}>
          <Play className="h-4 w-4" aria-hidden />
          Rodar agora
        </Button>
      </div>
    </Card>
  );
}

export default function AutomacoesPage() {
  const { data, isLoading } = useAutomations();
  const items = data?.items ?? [];
  const leadAutoAssign = items.find((r) => r.type === "LEAD_AUTO_ASSIGN");
  const slaReminder = items.find((r) => r.type === "SLA_REMINDER");

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Automações</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">Regras de distribuição de leads, SLAs e gatilhos de tarefas comerciais.</p>

      {isLoading ? (
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {leadAutoAssign && <LeadAutoAssignCard key={leadAutoAssign.updatedAt} rule={leadAutoAssign} />}
          {slaReminder && <SlaReminderCard key={slaReminder.updatedAt} rule={slaReminder} />}
        </div>
      )}
    </AdminShell>
  );
}
