"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function EmpreendimentosPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Empreendimentos"
        description="Empreendimento → Torre/Bloco → Unidade, com preço de empreendimento separado do preço da unidade."
        milestone="D"
      />
    </AdminShell>
  );
}
