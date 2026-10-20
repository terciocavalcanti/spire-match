"use client";

import { use } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <AdminShell>
      <ScreenPlaceholder
        title={`Lead ${id}`}
        description="Perfil do comprador, evidências de consentimento, timeline de eventos, propostas e próximos passos recomendados."
        milestone="D"
      />
    </AdminShell>
  );
}
