"use client";

import { use } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function AtendimentoPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(params);
  return (
    <AppShell>
      <ScreenPlaceholder
        title="Fale com um consultor"
        description={`Dados do corretor autorizado para o imóvel ${propertyId}, WhatsApp e agendamento — WhatsApp Business Cloud API entra como adapter opcional no Marco C.`}
        milestone="C"
      />
    </AppShell>
  );
}
