"use client";

import { Button, Card, EmptyState } from "@spire/ui-web";
import { Download, FileText } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useAttributionReport, useVgvReport } from "@/hooks/use-reports";
import { apiClient } from "@/lib/api-client";
import { LEAD_ACTIVITY_LABELS } from "@/lib/lead-labels";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

const PERIODS = [
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
];

export default function RelatoriosPage() {
  const [days, setDays] = useState(30);
  const { data: vgv, isLoading: loadingVgv } = useVgvReport({ days, groupBy: "broker" });
  const { data: attribution, isLoading: loadingAttribution } = useAttributionReport({ days });

  const maxVgv = Math.max(1, ...(vgv?.breakdown.map((b) => b.vgv) ?? [1]));

  return (
    <AdminShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink-primary">Relatórios</h1>
          <p className="mt-1 text-bodyMd text-ink-secondary">VGV, comissão e atribuição first/last/influenced — exportação PDF/CSV.</p>
        </div>
        <div className="flex gap-2">
          <a href={apiClient.reports.attributionCsvUrl({ days })} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4" aria-hidden />
              CSV de atribuição
            </Button>
          </a>
          <a href={apiClient.reports.pdfUrl({ days })} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4" aria-hidden />
              PDF do relatório
            </Button>
          </a>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => setDays(p.days)}
            className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${days === p.days ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-lg text-ink-primary">VGV por corretor</h2>
          <p className="mt-1 text-bodySm text-ink-secondary">
            {loadingVgv ? "—" : `${currencyFormatter.format(vgv?.vgv ?? 0)} em ${vgv?.wonCount ?? 0} negócio(s)`}
          </p>
          {loadingVgv ? (
            <div className="mt-4 h-40 animate-pulse rounded-xl bg-background-subtle" aria-hidden />
          ) : (vgv?.breakdown.length ?? 0) === 0 ? (
            <EmptyState title="Sem negócios ganhos no período" description="Ajuste o período acima." />
          ) : (
            <div className="mt-4 space-y-3">
              {vgv!.breakdown.map((b) => (
                <div key={b.key}>
                  <div className="flex items-center justify-between text-bodySm">
                    <span className="text-ink-secondary">{b.label}</span>
                    <span className="font-medium text-ink-primary">{currencyFormatter.format(b.vgv)}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-pill bg-background-subtle">
                    <div className="h-2 rounded-pill bg-brand-olive" style={{ width: `${(b.vgv / maxVgv) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg text-ink-primary">Atribuição por primeiro toque</h2>
          <p className="mt-1 text-bodySm text-ink-secondary">De onde veio o primeiro sinal comercial de cada venda.</p>
          {loadingAttribution ? (
            <div className="mt-4 h-40 animate-pulse rounded-xl bg-background-subtle" aria-hidden />
          ) : (attribution?.byFirstTouch.length ?? 0) === 0 ? (
            <EmptyState title="Sem dados de atribuição" description="Ajuste o período acima." />
          ) : (
            <div className="mt-4 space-y-2">
              {attribution!.byFirstTouch.map((entry) => (
                <div key={entry.channel} className="flex items-center justify-between text-bodySm">
                  <span className="text-ink-secondary">{LEAD_ACTIVITY_LABELS[entry.channel]}</span>
                  <span className="font-medium text-ink-primary">
                    {currencyFormatter.format(entry.vgv)} · {entry.wonCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="font-display text-lg text-ink-primary">Atribuição por venda</h2>
        <p className="mt-1 text-bodySm text-ink-secondary">
          Primeiro toque, último toque e canais influenciadores — só sinais reais já coletados pelo funil.
        </p>
        {loadingAttribution ? (
          <div className="mt-4 h-40 animate-pulse rounded-xl bg-background-subtle" aria-hidden />
        ) : (attribution?.rows.length ?? 0) === 0 ? (
          <div className="mt-4">
            <EmptyState title="Sem vendas no período" description="Ajuste o período acima." />
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border-subtle">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Comprador</th>
                  <th className="px-4 py-3">VGV</th>
                  <th className="px-4 py-3">Primeiro toque</th>
                  <th className="px-4 py-3">Último toque</th>
                  <th className="px-4 py-3">Influenciadores</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {attribution!.rows.map((row) => (
                  <tr key={row.leadId} className="hover:bg-background-subtle">
                    <td className="px-4 py-3 font-medium text-ink-primary">{row.buyerName}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-primary">{currencyFormatter.format(row.wonAmount)}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">
                      {LEAD_ACTIVITY_LABELS[row.firstTouchChannel]} · {dateFormatter.format(new Date(row.firstTouchAt))}
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">
                      {LEAD_ACTIVITY_LABELS[row.lastTouchChannel]} · {dateFormatter.format(new Date(row.lastTouchAt))}
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-tertiary">
                      {row.influencedChannels.length === 0 ? "—" : row.influencedChannels.map((c) => LEAD_ACTIVITY_LABELS[c]).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
