"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Ambulance,
  BarChart3,
  BellRing,
  Bot,
  BrainCircuit,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  ListOrdered,
  FileText,
  History,
  ImageIcon,
  LayoutDashboard,
  MessageCircle,
  Microscope,
  ScanSearch,
  Settings,
  ShieldCheck,
  Stethoscope,
  UserCog,
  Users,
  UsersRound,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { MENU_MODULOS, temPermissao } from "@/lib/permissions";

type MenuItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

const menuGroups: MenuGroup[] = [
  {
    label: "Visão geral",
    items: [{ href: "/dashboard", label: "Painel de controlo", icon: LayoutDashboard }],
  },
  {
    label: "Atendimento clínico",
    items: [
      { href: "/atendimento", label: "Atendimento", icon: Stethoscope },
      { href: "/atendimento/consultas", label: "Consultas", icon: ClipboardList },
      { href: "/atendimento/urgencias", label: "Urgências", icon: Ambulance },
      { href: "/atendimento/encaminhamentos", label: "Encaminhamentos", icon: UsersRound },
      { href: "/atendimento/fila", label: "Fila e chamadas", icon: ListOrdered },
      { href: "/atendimento/dashboard", label: "Indicadores do dia", icon: BarChart3 },
      { href: "/atendimento/relatorios", label: "Relatórios clínicos", icon: FileText },
      { href: "/pacientes", label: "Pacientes", icon: Users },
      { href: "/agendamentos", label: "Agendamentos", icon: CalendarDays },
    ],
  },
  {
    label: "Diagnóstico por imagem",
    items: [
      { href: "/exames", label: "Exames", icon: Microscope },
      { href: "/imagens", label: "Imagens e arquivos", icon: ImageIcon },
      { href: "/tipos-exame", label: "Catálogo de exames", icon: ClipboardList },
      { href: "/procedencias", label: "Origem dos pedidos", icon: Building2 },
    ],
  },
  {
    label: "Corpo clínico",
    items: [
      { href: "/tecnicos", label: "Profissionais", icon: Stethoscope },
      { href: "/turnos", label: "Turnos e escalas", icon: Clock3 },
      { href: "/medico", label: "Portal médico", icon: Activity },
      { href: "/medico/solicitar", label: "Solicitar exame", icon: FileText },
    ],
  },
  {
    label: "Inteligência clínica",
    items: [
      { href: "/cognitivo", label: "Centro cognitivo", icon: BrainCircuit },
      { href: "/cognitivo/assistente", label: "Assistente clínico", icon: Bot },
      { href: "/cognitivo/detector-mudancas", label: "Detector de alterações", icon: ScanSearch },
    ],
  },
  {
    label: "Gestão e suporte",
    items: [
      { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { href: "/historico", label: "Auditoria e histórico", icon: History },
      { href: "/chat", label: "Comunicação interna", icon: MessageCircle },
      { href: "/chamadas", label: "Chamadas", icon: BellRing },
      { href: "/utilizadores", label: "Utilizadores e acessos", icon: UserCog },
      { href: "/configuracoes", label: "Configurações", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  if (!session) return null;

  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (session.user.role === "MEDICO" && item.href === "/exames") return false;
        const modulo = MENU_MODULOS[item.href];
        return !modulo || temPermissao(session.user.role, modulo);
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card/95 shadow-xl backdrop-blur",
        "transition-[width] duration-300 ease-out",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center border-b", collapsed ? "justify-center" : "px-4")}>
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <Image src="/logo.svg" alt="Gestão Hospitalar" width={34} height={34} className="shrink-0 rounded-lg" priority />
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight">Gestão Hospitalar</p>
              <p className="text-[10px] font-medium uppercase tracking-wider text-primary">Imagiologia</p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Navegação principal">
        {visibleGroups.map((group) => {
          const groupIsActive = group.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
          const isOpen = openGroups[group.label] ?? groupIsActive;

          return (
            <section key={group.label} className="py-1">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => setOpenGroups((current) => ({ ...current, [group.label]: !isOpen }))}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-muted"
                  aria-expanded={isOpen}
                >
                  {group.label}
                  <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", !isOpen && "-rotate-90")} />
                </button>
              )}
              <AnimatePresence initial={false}>
                {(collapsed || isOpen) && (
                  <motion.div
                    initial={collapsed ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {group.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            "group relative my-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            isActive ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                            collapsed && "justify-center px-2"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.label}</span>}
                          {collapsed && (
                            <span className="pointer-events-none absolute left-full z-50 ml-3 hidden whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md group-hover:block">
                              {item.label}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          );
        })}
      </nav>

      <div className="shrink-0 border-t p-2">
        <div className={cn("flex items-center gap-2 rounded-lg px-2 py-2 text-xs text-muted-foreground", collapsed && "justify-center")}>
          <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          {!collapsed && <span className="truncate">Sessão protegida</span>}
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
