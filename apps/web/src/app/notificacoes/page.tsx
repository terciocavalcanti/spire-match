"use client";

import type { NotificationType } from "@spire/contracts";
import { EmptyState } from "@spire/ui-web";
import {
  Bell,
  CalendarCheck,
  Clock,
  FileText,
  Radar,
  Sparkles,
  Star,
  TrendingDown,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentType } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/hooks/use-notifications";

const TYPE_ICON: Record<NotificationType, ComponentType<{ className?: string }>> = {
  MATCH_NEW: Sparkles,
  PRICE_DROP: TrendingDown,
  VISIT_CONFIRMED: CalendarCheck,
  VISIT_REMINDER: Clock,
  PROPOSAL_UPDATE: FileText,
  RADAR_HIT: Radar,
  EXCLUSIVE_NEW: Star,
  LEAD_SIGNAL: Users,
  SYSTEM: Bell,
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function NotificacoesPage() {
  const router = useRouter();
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const hasUnread = items.some((n) => !n.readAt);

  return (
    <AppShell>
      <div className="px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl text-ink-primary">Notificações</h1>
          {hasUnread && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-bodySm font-medium text-ink-primary underline"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-background-subtle" aria-hidden />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-6">
            <EmptyState title="Nenhuma notificação ainda" description="Matches, visitas, propostas e radares aparecem aqui." />
          </div>
        ) : (
          <div className="mt-6 space-y-2">
            {items.map((notification) => {
              const Icon = TYPE_ICON[notification.type];
              const isUnread = !notification.readAt;
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (isUnread) markRead.mutate(notification.id);
                    if (notification.linkUrl) router.push(notification.linkUrl);
                  }}
                  className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
                    isUnread ? "border-brand-olive/40 bg-background-elevated" : "border-border-subtle bg-background-elevated/60"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background-subtle text-ink-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-bodyMd font-medium text-ink-primary">{notification.title}</p>
                      <span className="shrink-0 text-caption text-ink-tertiary">{timeAgo(notification.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 text-bodySm text-ink-secondary">{notification.body}</p>
                  </div>
                  {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-status-hot" aria-hidden />}
                </button>
              );
            })}
          </div>
        )}

        <p className="mt-6 text-caption text-ink-tertiary">
          Notificações push no navegador podem ser ativadas em{" "}
          <Link href="/perfil" className="underline">
            Meu perfil
          </Link>
          .
        </p>
      </div>
    </AppShell>
  );
}
