"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function ImoveisPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Imóveis"
        description="CRUD completo com rascunho/revisão/publicação/arquivamento, histórico de preço e importação CSV."
        milestone="D"
      />
    </AdminShell>
  );
}
