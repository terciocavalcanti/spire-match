"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ScreenPlaceholder } from "@/components/layout/ScreenPlaceholder";

export default function NotificacoesPage() {
  return (
    <AppShell>
      <ScreenPlaceholder
        title="Notificações"
        description="Inbox por categorias (matches, preços, visitas, exclusivos) alimentado pelo NotificationOrchestrator."
        milestone="C"
      />
    </AppShell>
  );
}
