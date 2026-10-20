"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function RadaresPage() {
  return (
    <AppShell>
      <ScreenPlaceholder
        title="Meus radares"
        description="Buscas salvas com gatilhos reais (novo imóvel, queda de preço, disponibilidade) e frequência configurável."
        milestone="C"
      />
    </AppShell>
  );
}
