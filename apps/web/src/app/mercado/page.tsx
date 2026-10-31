"use client";

import { Card, EmptyState } from "@spire/ui-web";
import { AlertCircle, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useMarketIndicators } from "@/hooks/use-market-indicators";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

function DecideSimulator() {
  const [price, setPrice] = useState("500000");
  const [downPayment, setDownPayment] = useState("100000");
  const [annualRate, setAnnualRate] = useState("11.5");
  const [years, setYears] = useState("30");

  const result = useMemo(() => {
    const p = Number(price);
    const down = Number(downPayment);
    const rate = Number(annualRate);
    const y = Number(years);
    const financed = p - down;
    if (!p || !y || financed <= 0 || rate < 0) return null;

    const months = y * 12;
    const monthlyRate = rate / 100 / 12;
    const installment =
      monthlyRate === 0 ? financed / months : (financed * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));

    return { financed, months, installment };
  }, [price, downPayment, annualRate, years]);

  return (
    <Card className="p-5">
      <h2 className="font-display text-xl text-ink-primary">Decide — simulador de financiamento</h2>
      <p className="mt-2 flex items-start gap-2 rounded-xl bg-status-warmBg p-3 text-bodySm text-status-warm">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Simulação educativa, calculada no seu navegador. Não é uma oferta, taxa ou aprovação real — fale com um consultor
        ou seu banco para condições efetivas.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-bodySm text-ink-secondary">Valor do imóvel</span>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-bodySm text-ink-secondary">Entrada</span>
          <input
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
            className="h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-bodySm text-ink-secondary">Taxa de juros ao ano (%)</span>
          <input
            type="number"
            step="0.1"
            value={annualRate}
            onChange={(e) => setAnnualRate(e.target.value)}
            className="h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-bodySm text-ink-secondary">Prazo (anos)</span>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(e.target.value)}
            className="h-12 w-full rounded-xl border border-border-subtle bg-background-elevated px-3 text-bodyMd text-ink-primary focus:border-brand-olive focus:outline-none"
          />
        </label>
      </div>

      {result ? (
        <div className="mt-4 rounded-xl bg-background-subtle p-4">
          <p className="text-bodySm text-ink-secondary">Valor financiado: {currencyFormatter.format(result.financed)}</p>
          <p className="mt-1 font-display text-2xl text-ink-primary">
            ≈ {currencyFormatter.format(result.installment)} <span className="text-bodyMd text-ink-secondary">por mês</span>
          </p>
          <p className="mt-1 text-caption text-ink-tertiary">{result.months} parcelas — sistema PRICE (parcelas fixas), estimativa simplificada.</p>
        </div>
      ) : (
        <p className="mt-4 text-bodySm text-status-danger">A entrada precisa ser menor que o valor do imóvel.</p>
      )}
    </Card>
  );
}

export default function MercadoPage() {
  const { data, isLoading } = useMarketIndicators();
  const indicators = data?.items ?? [];

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <h1 className="font-display text-2xl text-ink-primary">Mercado</h1>
        <p className="mt-1 text-bodyMd text-ink-secondary">Indicadores reais, sempre com fonte, período e metodologia declarados.</p>

        {isLoading ? (
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
        ) : indicators.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={<TrendingUp className="h-8 w-8" aria-hidden />}
              title="Nenhum indicador disponível no momento"
              description="O time de conteúdo ainda não publicou indicadores de mercado verificados para esta região."
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {indicators.map((indicator) => (
              <Card key={indicator.id} className="p-5">
                <p className="text-bodySm text-ink-secondary">{indicator.title}</p>
                <p className="mt-1 font-display text-2xl text-ink-primary">
                  {indicator.value} {indicator.unit}
                </p>
                <p className="mt-2 text-caption text-ink-tertiary">
                  {indicator.region} · {indicator.period}
                </p>
                <p className="mt-1 text-caption text-ink-tertiary">Fonte: {indicator.source}</p>
                <details className="mt-2">
                  <summary className="cursor-pointer text-caption text-brand-olive">Metodologia</summary>
                  <p className="mt-1 text-caption text-ink-tertiary">{indicator.methodology}</p>
                </details>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-6">
          <DecideSimulator />
        </div>
      </div>
    </AppShell>
  );
}
