"use client";

import { AdminShell } from "@/components/layout/AdminShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function NotificacoesAdminPage() {
  return (
    <AdminShell>
      <ScreenPlaceholder
        title="Notificações"
        description="Templates, canais, taxa de falha e entregabilidade do NotificationOrchestrator."
        milestone="D"
      />
    </AdminShell>
  );
}
