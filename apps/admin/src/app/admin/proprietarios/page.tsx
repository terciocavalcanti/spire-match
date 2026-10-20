"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function ProprietariosPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Proprietários"
        description="Autorizações de captação, intenção de venda/locação e consentimentos do proprietário."
        milestone="E"
      />
    </AdminShell>
  );
}
