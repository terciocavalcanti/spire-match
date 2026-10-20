"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function MensagensPage() {
  return (
    <AppShell>
      <ScreenPlaceholder
        title="Mensagens"
        description="Histórico de contato com consultores por imóvel, consolidado em uma caixa de entrada única."
        milestone="C"
      />
    </AppShell>
  );
}
