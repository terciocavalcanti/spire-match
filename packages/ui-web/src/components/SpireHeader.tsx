import { Bell } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/cn";

import { SpireMark } from "./SpireMark";

export interface SpireHeaderProps extends React.HTMLAttributes<HTMLElement> {
  user?: { name: string; avatarUrl?: string | null } | null;
  hasUnreadNotifications?: boolean;
  onNotificationsClick?: () => void;
  onAvatarClick?: () => void;
  /** Slot opcional para busca/saudação abaixo da barra de topo. */
  children?: React.ReactNode;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "").concat(parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "").toUpperCase();
}

export function SpireHeader({
  user,
  hasUnreadNotifications,
  onNotificationsClick,
  onAvatarClick,
  children,
  className,
  ...props
}: SpireHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-30 bg-background-base/95 backdrop-blur", className)} {...props}>
      <div className="flex items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-2 text-ink-primary">
          <SpireMark className="h-5 w-5" />
          <span className="font-display text-lg tracking-[0.2em]">SPIRE</span>
        </div>

        {user !== undefined && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Notificações"
              onClick={onNotificationsClick}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-primary transition-colors hover:bg-background-subtle"
            >
              <Bell className="h-5 w-5" aria-hidden />
              {hasUnreadNotifications && (
                <span
                  aria-hidden
                  className="absolute right-2 top-2 h-2 w-2 rounded-full bg-status-hot"
                />
              )}
            </button>

            {user ? (
              <button
                type="button"
                onClick={onAvatarClick}
                aria-label={`Perfil de ${user.name}`}
                className="h-10 w-10 overflow-hidden rounded-full border border-border-subtle bg-background-subtle"
              >
                {user.avatarUrl ? (
                  // Componente web-agnóstico (sem Next.js) — <img> simples é intencional aqui.
                  <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-ink-secondary">
                    {initials(user.name)}
                  </span>
                )}
              </button>
            ) : null}
          </div>
        )}
      </div>
      {children}
    </header>
  );
}
