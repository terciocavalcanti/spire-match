"use client";

import { EmptyState } from "@spire/ui-web";
import { BarChart3 } from "lucide-react";

import { AdminShell } from "@/components/layout/AdminShell";
import { useCurrentUser } from "@/hooks/use-current-user";

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName;
}

export default function AdminOverviewPage() {
  const { data: user, isLoading } = useCurrentUser();

  return (
    <AdminShell>
      {isLoading ? (
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
        {["Novos leads", "Leads quentes", "Visitas agendadas", "Vendas"].map((label) => (
          <div key={label} className="rounded-2xl border border-border-subtle bg-background-elevated p-5">
            <p className="text-bodySm text-ink-secondary">{label}</p>
            <p className="mt-2 font-display text-3xl text-ink-tertiary">—</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" aria-hidden />}
          title="Funil comercial e indicadores reais"
          description="KPIs, funil e tabela de leads mais quentes entram no Marco D, conectados ao CRM SPIRE (leads, visitas, propostas e vendas reais)."
        />
      </div>
    </AdminShell>
  );
}
