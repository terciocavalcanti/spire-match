"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function FunilPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Funil comercial"
        description="Kanban/pipeline (Novo → Qualificando → Interesse → Visita → Proposta → Negociação → Ganho/Perdido) com motivo de mudança de estágio."
        milestone="D"
      />
    </AdminShell>
  );
}
