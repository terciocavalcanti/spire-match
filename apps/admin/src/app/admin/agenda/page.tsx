"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function AgendaPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Agenda"
        description="Calendário de corretores e visitas, com reservas atômicas e detecção de conflitos."
        milestone="D"
      />
    </AdminShell>
  );
}
