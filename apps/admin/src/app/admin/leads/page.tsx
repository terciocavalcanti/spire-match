"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function LeadsPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Leads / Oportunidades"
        description="Tabela segmentada com Match Score, Lead Score, responsável, temperatura e exportação auditada."
        milestone="D"
      />
    </AdminShell>
  );
}
