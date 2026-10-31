import type { AdminNavGroup } from "@spire/ui-web";
import {
  BarChart3,
  Bell,
  Briefcase,
  CalendarDays,
  Factory,
  FileText,
  Filter,
  Inbox,
  Key,
  LayoutDashboard,
  Layers,
  Lock,
  Megaphone,
  Handshake,
  Plug,
  Settings,
  ShieldCheck,
  Users,
  UserCircle,
  Wallet,
  Building2,
  DoorOpen,
  Zap,
} from "lucide-react";


// Reflete a matriz do prompt mestre (prancha 06 + módulos adicionais obrigatórios).
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Comercial",
    items: [
      { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
      { href: "/admin/leads", label: "Leads", icon: Users },
      { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
      { href: "/admin/funil", label: "Funil comercial", icon: Filter },
    ],
  },
  {
    label: "Carteira",
    items: [
      { href: "/admin/imoveis", label: "Imóveis", icon: Building2 },
      { href: "/admin/empreendimentos", label: "Empreendimentos", icon: Layers },
      { href: "/admin/unidades", label: "Unidades", icon: DoorOpen },
      { href: "/admin/proprietarios", label: "Proprietários", icon: Key },
      { href: "/admin/captacoes", label: "Captações", icon: Inbox },
    ],
  },
  {
    label: "Pessoas",
    items: [
      { href: "/admin/usuarios", label: "Usuários", icon: UserCircle },
      { href: "/admin/corretores", label: "Corretores", icon: Briefcase },
      { href: "/admin/incorporadoras", label: "Incorporadoras", icon: Factory },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/admin/campanhas", label: "Campanhas", icon: Megaphone },
      { href: "/admin/parceiros", label: "Parceiros", icon: Handshake },
      { href: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
      { href: "/admin/financeiro", label: "Financeiro", icon: Wallet },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/admin/conteudo", label: "Conteúdo", icon: FileText },
      { href: "/admin/automacoes", label: "Automações", icon: Zap },
      { href: "/admin/notificacoes", label: "Notificações", icon: Bell },
      { href: "/admin/integracoes", label: "Integrações", icon: Plug },
      { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
      { href: "/admin/auditoria", label: "Auditoria", icon: ShieldCheck },
      { href: "/admin/privacidade", label: "Privacidade", icon: Lock },
    ],
  },
];
