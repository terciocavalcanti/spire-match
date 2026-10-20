"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function IncorporadorasPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Incorporadoras"
        description="Parceiros autorizados com acesso restrito a resultados agregados de seus próprios empreendimentos."
        milestone="E"
      />
    </AdminShell>
  );
}
