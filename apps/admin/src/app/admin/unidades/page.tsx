"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function UnidadesPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Unidades"
        description="Disponibilidade, status e histórico de preço por unidade dentro de cada empreendimento."
        milestone="D"
      />
    </AdminShell>
  );
}
