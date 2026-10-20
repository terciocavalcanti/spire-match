"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function ConteudoPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Conteúdo"
        description="Textos editoriais, indicadores de mercado com fonte/período/metodologia declarados."
        milestone="E"
      />
    </AdminShell>
  );
}
