"use client";

import type { Commission, CommissionStatus } from "@spire/contracts";
import { COMMISSION_STATUSES } from "@spire/contracts";
import { Button, Card, EmptyState, Input } from "@spire/ui-web";
import { useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useCommissions, useCommissionsSummary, useMarkCommissionReceived } from "@/hooks/use-reports";
import { COMMISSION_STATUS_LABELS } from "@/lib/commission-labels";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function MarkReceivedForm({ commission, onDone }: { commission: Commission; onDone: () => void }) {
  const [amount, setAmount] = useState(commission.previstoAmount.toString());
  const markReceived = useMarkCommissionReceived();

  return (
    <div className="flex items-center gap-2">
      <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-32" />
      <Button
        size="sm"
        disabled={markReceived.isPending || !amount}
        onClick={() => markReceived.mutate({ id: commission.id, payload: { recebidoAmount: Number(amount) } }, { onSuccess: onDone })}
      >
        Confirmar
      </Button>
      <Button size="sm" variant="outline" onClick={onDone}>
        Cancelar
      </Button>
    </div>
  );
}

export default function FinanceiroPage() {
  const [status, setStatus] = useState<CommissionStatus | "ALL">("ALL");
  const [markingId, setMarkingId] = useState<string | null>(null);
  const { data: summary, isLoading: loadingSummary } = useCommissionsSummary({ days: 30 });
  const { data, isLoading } = useCommissions({ status: status === "ALL" ? undefined : status, limit: 100 });

  const items = data?.items ?? [];

  return (
    <AdminShell>
      <h1 className="font-display text-2xl text-ink-primary">Financeiro</h1>
      <p className="mt-1 text-bodyMd text-ink-secondary">
        Comissões, custos de campanha e ROI com metodologia declarada — VGV, previsto e recebido nunca são a mesma métrica.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-bodySm text-ink-secondary">VGV (30 dias)</p>
          <p className="mt-2 font-display text-2xl text-ink-primary">{loadingSummary ? "—" : currencyFormatter.format(summary?.vgv ?? 0)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-bodySm text-ink-secondary">Comissão prevista</p>
          <p className="mt-2 font-display text-2xl text-ink-primary">{loadingSummary ? "—" : currencyFormatter.format(summary?.previstoTotal ?? 0)}</p>
          <p className="mt-1 text-caption text-ink-tertiary">{summary?.previstoCount ?? 0} comissão(ões)</p>
        </Card>
        <Card className="p-5">
          <p className="text-bodySm text-ink-secondary">Comissão recebida</p>
          <p className="mt-2 font-display text-2xl text-status-success">{loadingSummary ? "—" : currencyFormatter.format(summary?.recebidoTotal ?? 0)}</p>
          <p className="mt-1 text-caption text-ink-tertiary">{summary?.recebidoCount ?? 0} comissão(ões)</p>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatus("ALL")}
          className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${status === "ALL" ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"}`}
        >
          Todas
        </button>
        {COMMISSION_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-pill px-3 py-1.5 text-bodySm font-medium transition-colors ${status === s ? "bg-brand-charcoal text-ink-inverse" : "bg-background-subtle text-ink-secondary hover:bg-border-subtle"}`}
          >
            {COMMISSION_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="h-64 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : items.length === 0 ? (
          <EmptyState title="Nenhuma comissão encontrada" description="Comissões são criadas automaticamente quando um lead vira Ganho." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated">
            <table className="w-full text-left">
              <thead className="border-b border-border-subtle bg-background-subtle text-caption uppercase tracking-wide text-ink-tertiary">
                <tr>
                  <th className="px-4 py-3">Comprador</th>
                  <th className="px-4 py-3">Corretor</th>
                  <th className="px-4 py-3">VGV</th>
                  <th className="px-4 py-3">Prevista</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {items.map((c) => (
                  <tr key={c.id} className="hover:bg-background-subtle">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-primary">{c.buyerName}</p>
                      <p className="text-bodySm text-ink-tertiary">{c.propertyTitle ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">{c.brokerName ?? "Sem corretor"}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-primary">{currencyFormatter.format(c.baseAmount)}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-primary">{currencyFormatter.format(c.previstoAmount)}</td>
                    <td className="px-4 py-3 text-bodySm text-ink-secondary">
                      {c.status === "RECEBIDO" ? `${COMMISSION_STATUS_LABELS[c.status]} (${currencyFormatter.format(c.recebidoAmount ?? 0)})` : COMMISSION_STATUS_LABELS[c.status]}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.status === "PREVISTO" &&
                        (markingId === c.id ? (
                          <MarkReceivedForm commission={c} onDone={() => setMarkingId(null)} />
                        ) : (
                          <button type="button" onClick={() => setMarkingId(c.id)} className="text-bodySm font-medium text-brand-olive hover:underline">
                            Marcar recebida
                          </button>
                        ))}
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
