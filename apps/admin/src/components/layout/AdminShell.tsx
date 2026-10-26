"use client";

import { AdminSidebar, Button } from "@spire/ui-web";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useCurrentUser } from "@/hooks/use-current-user";
import { apiClient } from "@/lib/api-client";
import { hasAdminAccess } from "@/lib/roles";

import { ADMIN_NAV_GROUPS } from "./nav-groups";

function NextLink({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link href={href} {...props} />;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && user === null) router.replace("/entrar");
  }, [isLoading, user, router]);

  if (isLoading || user === undefined) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background-base">
        <div className="h-10 w-10 animate-pulse rounded-full bg-background-subtle" aria-hidden />
      </div>
    );
  }

  if (!user) return null; // redirecionando para /entrar

  if (!hasAdminAccess(user.roles)) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background-base px-6 text-center">
        <ShieldAlert className="h-10 w-10 text-status-danger" aria-hidden />
        <h1 className="font-display text-2xl text-ink-primary">Acesso restrito</h1>
        <p className="max-w-sm text-bodyMd text-ink-secondary">
          A conta {user.email} não tem permissão para acessar o painel comercial SPIRE.
        </p>
        <Button
          variant="outline"
          onClick={async () => {
            await apiClient.auth.logout();
            router.replace("/entrar");
          }}
        >
          Sair e entrar com outra conta
        </Button>
      </div>
    );
  }

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
