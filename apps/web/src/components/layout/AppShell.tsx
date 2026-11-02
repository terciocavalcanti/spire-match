"use client";

import { BottomNavigation, SpireHeader } from "@spire/ui-web";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useUnreadNotificationsCount } from "@/hooks/use-notifications";

import { BOTTOM_NAV_ITEMS } from "./nav-items";

// Espaço extra entre o fim do conteúdo e o topo da barra — não é o "respiro"
// da barra em si (ela já reserva o próprio env(safe-area-inset-bottom)).
const CONTENT_TO_NAV_GAP_PX = 12;
// Só usado no primeiríssimo render, antes do ResizeObserver medir a altura
// real — evita colar no 0 por uma fração de segundo.
const INITIAL_NAV_HEIGHT_PX = 65;

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
  const navRef = useRef<HTMLElement>(null);
  const [navHeight, setNavHeight] = useState(INITIAL_NAV_HEIGHT_PX);

  // Mede a altura REAL da barra (já inclui o próprio env(safe-area-inset-bottom)
  // dela) em vez de reservar um valor fixo arredondado — um valor fixo maior
  // que a barra de verdade sobra como espaço morto entre o conteúdo e a barra
  // (ficava bem visível em telas curtas, como o card do /mapa), e um valor
  // menor deixaria conteúdo escondido atrás dela. ResizeObserver acompanha
  // mudanças de safe-area (rotação de tela, etc.) automaticamente.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setNavHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

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

      {/* --app-shell-bottom-clearance: exposta para páginas de composição fixa
          (como /mapa) que precisam cancelar esse padding com margin-bottom
          negativo — sem isso, o espaço reservado aqui para páginas de rolagem
          normal se soma à margem própria do último elemento dessas páginas,
          dobrando a distância até a barra. */}
      <main
        className="relative flex-1"
        style={
          {
            paddingBottom: `${navHeight + CONTENT_TO_NAV_GAP_PX}px`,
            "--app-shell-bottom-clearance": `${navHeight + CONTENT_TO_NAV_GAP_PX}px`,
          } as React.CSSProperties
        }
      >
        {children}
      </main>

      <BottomNavigation ref={navRef} items={BOTTOM_NAV_ITEMS} activeHref={pathname} LinkComponent={NextLink} />
    </div>
  );
}
