"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function FinanceiroPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Financeiro"
        description="Comissões, custos de campanha e ROI com metodologia declarada — nunca métricas misturadas."
        milestone="D"
      />
    </AdminShell>
  );
}
