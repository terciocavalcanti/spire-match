"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function ConfiguracoesPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Configurações"
        description="Roles/permissões, regras de peso do Match Engine, feature flags e parâmetros de fila."
        milestone="D"
      />
    </AdminShell>
  );
}
