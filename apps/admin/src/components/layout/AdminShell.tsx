"use client";

import { AdminSidebar } from "@spire/ui-web";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCurrentUser } from "@/hooks/use-current-user";

import { ADMIN_NAV_GROUPS } from "./nav-groups";

function NextLink({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link href={href} {...props} />;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();

  return (
    <div className="flex min-h-dvh bg-background-base">
      <AdminSidebar groups={ADMIN_NAV_GROUPS} activeHref={pathname} LinkComponent={NextLink} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-border-subtle bg-background-elevated px-6 py-4">
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-background-subtle text-sm font-semibold text-ink-secondary">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight">
                <p className="text-bodySm font-semibold text-ink-primary">{user.name}</p>
                <p className="text-caption text-ink-tertiary">{user.roles.join(", ") || "Sem papel"}</p>
              </div>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
