"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function MinhasVisitasPage() {
  return (
    <AppShell>
      <ScreenPlaceholder
        title="Minhas visitas"
        description="Próximos agendamentos, concluídas, propostas enviadas e próximos passos recomendados."
        milestone="C"
      />
    </AppShell>
  );
}
