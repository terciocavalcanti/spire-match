"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function AutomacoesPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Automações"
        description="Regras de distribuição de leads, SLAs e gatilhos de tarefas comerciais."
        milestone="D"
      />
    </AdminShell>
  );
}
