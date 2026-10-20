import type { BottomNavItem } from "@spire/ui-web";
import { Activity, Compass, Home, MessageCircle, User } from "lucide-react";


// Bottom nav fixo com 5 itens — ver docs/architecture/ADR_NAVEGACAO.md.
// Favoritos fica a 1 toque (coração nos cards + atalho no Perfil), sem aba própria.
export const BOTTOM_NAV_ITEMS: BottomNavItem[] = [
  { href: "/inicio", label: "Início", icon: Home },
  { href: "/explorar", label: "Explorar", icon: Compass },
  { href: "/matches/descobrir", label: "Matches", icon: Activity },
  { href: "/mensagens", label: "Mensagens", icon: MessageCircle },
  { href: "/perfil", label: "Perfil", icon: User },
];
