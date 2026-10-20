"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function TourPage() {
  return (
    <AppShell>
      <ScreenPlaceholder
        title="Tour Inteligente"
        description="Roteiro otimizado para visitar 2–5 imóveis, com estimativas de deslocamento declaradas por fonte (nunca inventadas)."
        milestone="C"
      />
    </AppShell>
  );
}
