"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function AuditoriaPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Auditoria"
        description="Trilha de mudanças e logs de acesso a ações privilegiadas (audit_logs)."
        milestone="F"
      />
    </AdminShell>
  );
}
