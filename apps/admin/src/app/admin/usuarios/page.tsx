"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function UsuariosPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Usuários"
        description="Gestão de contas internas, papéis (RBAC) e revogação de sessões."
        milestone="D"
      />
    </AdminShell>
  );
}
