import * as React from "react";

import { cn } from "../lib/cn";

import { SpireMark } from "./SpireMark";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export interface AdminSidebarProps {
  groups: AdminNavGroup[];
  activeHref: string;
  LinkComponent?: React.ComponentType<
    React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
  >;
  className?: string;
}

export function AdminSidebar({ groups, activeHref, LinkComponent, className }: AdminSidebarProps) {
  const Anchor = LinkComponent ?? "a";

  return (
    <aside
      className={cn(
        "hidden w-64 shrink-0 flex-col border-r border-border-subtle bg-background-elevated px-4 py-6 lg:flex",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-2 text-ink-primary">
        <SpireMark className="h-5 w-5" />
        <div className="leading-none">
          <p className="font-display text-base tracking-[0.2em]">VALORI</p>
          <p className="text-[10px] tracking-[0.3em] text-ink-secondary">MATCH</p>
        </div>
      </div>

      <nav className="mt-8 flex-1 space-y-6 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wide text-ink-tertiary">
              {group.label}
            </p>
            <ul className="mt-2 space-y-1">
              {group.items.map((item) => {
                const isActive = activeHref === item.href || activeHref.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Anchor
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-bodyMd transition-colors",
                        isActive
                          ? "bg-brand-charcoal text-ink-inverse"
                          : "text-ink-secondary hover:bg-background-subtle hover:text-ink-primary",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Anchor>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
