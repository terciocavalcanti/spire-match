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

      {/* pb-24 cobre a altura normal da barra de navegação fixa (BottomNavigation);
          soma-se env(safe-area-inset-bottom) porque a barra cresce por esse
          valor em aparelhos com gesture bar/home indicator — sem isso, o
          espaço reservado aqui não acompanha, e o conteúdo pode ficar
          colado na barra em telas com safe-area maior. */}
      <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))]">{children}</main>

      <BottomNavigation items={BOTTOM_NAV_ITEMS} activeHref={pathname} LinkComponent={NextLink} />
    </div>
  );
}
