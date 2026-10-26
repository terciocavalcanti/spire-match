"use client";

import type { Visit, VisitStatus } from "@spire/contracts";
import { EmptyState } from "@spire/ui-web";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useBrokers } from "@/hooks/use-admin-brokers";
import { useAdminAgenda } from "@/hooks/use-admin-visits";

const STATUS_LABELS: Record<VisitStatus, string> = {
  SCHEDULED: "Agendada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
};

const STATUS_CLASSES: Record<VisitStatus, string> = {
  SCHEDULED: "bg-status-infoBg text-status-info",
  COMPLETED: "bg-status-successBg text-status-success",
  CANCELLED: "bg-background-subtle text-ink-tertiary",
};

function groupByDate(visits: Visit[]): Array<[string, Visit[]]> {
  const groups = new Map<string, Visit[]>();
  for (const visit of visits) {
    const key = new Date(visit.scheduledAt).toLocaleDateString("pt-BR", { timeZone: "America/Recife" });
    groups.set(key, [...(groups.get(key) ?? []), visit]);
  }
  return Array.from(groups.entries());
}

export default function AgendaPage() {
  const [brokerId, setBrokerId] = useState("");
  const { data: brokersData } = useBrokers();
  const { data, isLoading } = useAdminAgenda({ brokerId: brokerId || undefined });
  const brokers = brokersData?.items ?? [];
  const groups = groupByDate(data?.items ?? []);

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Agenda</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">Todas as visitas agendadas pelo time comercial.</p>

      <div className="mt-6">
        <select
          value={brokerId}
          onChange={(e) => setBrokerId(e.target.value)}
          className="h-11 rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodySm text-ink-primary focus:border-brand-olive focus:outline-none"
        >
          <option value="">Todos os corretores</option>
          {brokers.map((broker) => (
            <option key={broker.id} value={broker.id}>
              {broker.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : groups.length === 0 ? (
          <EmptyState title="Nenhuma visita encontrada" description="Ainda não há visitas agendadas para este filtro." />
        ) : (
          <div className="space-y-6">
            {groups.map(([date, visits]) => (
              <div key={date}>
                <h2 className="font-display text-lg capitalize text-ink-primary">{date}</h2>
                <div className="mt-3 overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
                  <table className="w-full text-left">
                    <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                      <tr>
                        <th className="px-4 py-3">Horário</th>
                        <th className="px-4 py-3">Imóvel</th>
                        <th className="px-4 py-3">Comprador</th>
                        <th className="px-4 py-3">Corretor</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {visits.map((visit) => (
                        <tr key={visit.id}>
                          <td className="px-4 py-3 text-bodySm text-ink-primary">
                            {new Date(visit.scheduledAt).toLocaleTimeString("pt-BR", {
                              timeZone: "America/Recife",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3 text-bodySm text-ink-primary">{visit.property.title}</td>
                          <td className="px-4 py-3 text-bodySm text-ink-secondary">{visit.buyer?.name ?? "—"}</td>
                          <td className="px-4 py-3 text-bodySm text-ink-secondary">{visit.broker.name}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-pill px-2.5 py-1 text-caption font-medium ${STATUS_CLASSES[visit.status]}`}>
                              {STATUS_LABELS[visit.status]}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
