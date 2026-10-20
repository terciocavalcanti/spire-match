"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function RelatoriosPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Relatórios"
        description="VGV, comissão prevista x recebida, atribuição first/last/influenced, exportação PDF/CSV."
        milestone="D"
      />
    </AdminShell>
  );
}
