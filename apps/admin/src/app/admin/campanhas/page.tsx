"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function CampanhasPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Campanhas"
        description="Campanhas de incorporadoras e parcerias, com contrato, período, verba e atribuição de leads."
        milestone="E"
      />
    </AdminShell>
  );
}
