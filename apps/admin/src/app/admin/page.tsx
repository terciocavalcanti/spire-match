"use client";

import { Card } from "@spire/ui-web";
import { ArrowUpRight, Flame, Handshake, TrendingUp } from "lucide-react";
import Link from "next/link";

import { AdminShell } from "@/components/layout/AdminShell";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useFunnelReport, useLeadsOverview } from "@/hooks/use-leads";
import { LEAD_STAGE_LABELS } from "@/lib/lead-labels";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export default function AdminOverviewPage() {
  const { data: user, isLoading: loadingUser } = useCurrentUser();
  const { data: overview, isLoading: loadingOverview } = useLeadsOverview();
  const { data: funnel, isLoading: loadingFunnel } = useFunnelReport(30);

  const kpis = [
    { label: "Novos leads (7 dias)", value: overview?.newLeadsLast7Days, icon: ArrowUpRight },
    { label: "Leads quentes", value: overview?.hotLeadsCount, icon: Flame },
    { label: "Visitas agendadas (7 dias)", value: overview?.visitsScheduledLast7Days, icon: TrendingUp },
    { label: "Vendas (30 dias)", value: overview?.wonLeadsLast30Days, icon: Handshake },
  ];

  const maxStageCount = Math.max(1, ...(overview?.leadsByStage.map((s) => s.count) ?? [1]));

  return (
    <AdminShell>
      {loadingUser ? (
        <div className="h-10 w-64 animate-pulse rounded-lg bg-background-subtle" aria-hidden />
      ) : (
        <>
          <h1 className="font-display text-3xl text-ink-primary">
            Bom dia{user ? `, ${firstName(user.name)}` : ""}
          </h1>
          <p className="mt-1 text-bodyLg text-ink-secondary">Aqui está o desempenho do seu time comercial.</p>
        </>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-bodySm text-ink-secondary">{label}</p>
              <Icon className="h-4 w-4 text-ink-tertiary" aria-hidden />
            </div>
            <p className="mt-2 font-display text-3xl text-ink-primary">
              {loadingOverview ? "—" : value ?? 0}
            </p>
          </Card>
        ))}
        <Card className="p-5 sm:col-span-2 lg:col-span-4">
          <p className="text-bodySm text-ink-secondary">VGV (últimos 30 dias)</p>
          <p className="mt-2 font-display text-3xl text-ink-primary">
            {loadingOverview ? "—" : currencyFormatter.format(overview?.vgvLast30Days ?? 0)}
          </p>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink-primary">Leads por estágio</h2>
            <Link href="/admin/funil" className="text-bodySm font-medium text-brand-olive hover:underline">
              Ver funil completo
            </Link>
          </div>
          {loadingOverview ? (
            <div className="mt-4 h-40 animate-pulse rounded-xl bg-background-subtle" aria-hidden />
          ) : (
            <div className="mt-4 space-y-3">
              {(overview?.leadsByStage ?? []).map(({ stage, count }) => (
                <div key={stage}>
                  <div className="flex items-center justify-between text-bodySm">
                    <span className="text-ink-secondary">{LEAD_STAGE_LABELS[stage]}</span>
                    <span className="font-medium text-ink-primary">{count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-pill bg-background-subtle">
                    <div
                      className="h-2 rounded-pill bg-brand-olive"
                      style={{ width: `${(count / maxStageCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg text-ink-primary">Conversão (30 dias)</h2>
          {loadingFunnel ? (
            <div className="mt-4 h-24 animate-pulse rounded-xl bg-background-subtle" aria-hidden />
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-bodySm text-ink-secondary">Taxa de conversão</p>
                <p className="font-display text-2xl text-ink-primary">
                  {funnel ? `${funnel.conversionRate.toFixed(1)}%` : "—"}
                </p>
              </div>
              <div className="flex items-center justify-between text-bodySm">
                <span className="text-ink-secondary">Ganhos</span>
                <span className="font-medium text-status-success">{funnel?.wonCount ?? 0}</span>
              </div>
              <div className="flex items-center justify-between text-bodySm">
                <span className="text-ink-secondary">Perdidos</span>
                <span className="font-medium text-status-danger">{funnel?.lostCount ?? 0}</span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
