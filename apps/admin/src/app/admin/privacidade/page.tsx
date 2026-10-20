"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function PrivacidadeAdminPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Privacidade"
        description="Requisições LGPD (exportação/exclusão de dados) e prazos de retenção parametrizados."
        milestone="F"
      />
    </AdminShell>
  );
}
