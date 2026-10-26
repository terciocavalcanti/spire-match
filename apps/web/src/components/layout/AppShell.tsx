"use client";

import { BottomNavigation, SpireHeader } from "@spire/ui-web";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";

import { BOTTOM_NAV_ITEMS } from "./nav-items";

function NextLink({ href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <Link href={href} {...props} />;
}

export interface AppShellProps {
  children: React.ReactNode;
  /** Slot de busca/saudação renderizado logo abaixo da barra de topo. */
  headerSlot?: React.ReactNode;
}

export function AppShell({ children, headerSlot }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { data: unread } = useUnreadNotificationsCount(Boolean(user));

  return (
    <div className="flex min-h-dvh flex-col bg-background-base">
      <SpireHeader
        user={user ? { name: user.name, avatarUrl: user.avatarUrl } : user === null ? null : undefined}
        hasUnreadNotifications={Boolean(unread && unread.count > 0)}
        onNotificationsClick={() => router.push("/notificacoes")}
        onAvatarClick={() => router.push("/perfil")}
      >
        {headerSlot}
      </SpireHeader>

      <main className="flex-1 pb-24">{children}</main>

      <BottomNavigation items={BOTTOM_NAV_ITEMS} activeHref={pathname} LinkComponent={NextLink} />
    </div>
  );
}
