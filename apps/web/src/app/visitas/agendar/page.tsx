"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function AgendarVisitaPage() {
  return (
    <AppShell>
      <ScreenPlaceholder
        title="Agendar visita"
        description="Calendário com slots do corretor/propriedade e confirmação transacional (sem sobreposição)."
        milestone="C"
      />
    </AppShell>
  );
}
