"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function CorretoresPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Corretores"
        description="Times, disponibilidade, metas, performance e papéis de corretores e gestores."
        milestone="D"
      />
    </AdminShell>
  );
}
