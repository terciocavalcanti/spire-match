"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function IntegracoesPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Integrações"
        description="Status de mapas, storage, SMTP, WhatsApp e LLM — mostra claramente o que está pendente de credencial."
        milestone="D"
      />
    </AdminShell>
  );
}
