"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function CaptacoesPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Captações"
        description="Pipeline de captação de imóveis, da triagem à designação de corretor."
        milestone="E"
      />
    </AdminShell>
  );
}
