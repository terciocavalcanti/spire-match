import * as React from "react";

import { cn } from "../lib/cn";

export interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export interface BottomNavigationProps {
  items: BottomNavItem[];
  activeHref: string;
  /** Permite injetar o `Link` do Next.js sem acoplar este pacote ao framework. */
  LinkComponent?: React.ComponentType<
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
  >;
  className?: string;
}

/**
 * Navegação inferior fixa com 5 itens (Início · Explorar · Matches ·
 * Mensagens · Perfil) — decisão de consolidação documentada em
 * docs/architecture/ADR_NAVEGACAO.md. Favoritos é acessível em 1 toque via
 * coração nos cards e atalho no Perfil, não ocupa aba própria aqui.
 */
export function BottomNavigation({
  items,
  activeHref,
  LinkComponent,
  className,
}: BottomNavigationProps) {
  const Anchor = LinkComponent ?? "a";

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-border-subtle bg-background-elevated/95 backdrop-blur",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2">
        {items.map((item) => {
          const isActive = activeHref === item.href || activeHref.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Anchor
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-3 text-[10px] font-medium leading-none transition-colors",
                  isActive ? "text-ink-primary" : "text-ink-tertiary",
                )}
              >
                <span className="relative">
                  <Icon className="h-[18px] w-[18px]" />
                  {!!item.badge && item.badge > 0 && (
                    <span
                      aria-hidden
                      className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-hot px-1 text-[10px] text-ink-inverse"
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </span>
                <span className="mt-0.5">{item.label}</span>
                {isActive && <span aria-hidden className="mt-0.5 h-1 w-1 rounded-full bg-ink-primary" />}
              </Anchor>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
