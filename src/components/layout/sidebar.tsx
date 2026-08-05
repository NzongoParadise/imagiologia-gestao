"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { temPermissao, MENU_MODULOS } from "@/lib/permissions";
import {
  LayoutDashboard,
  Users,
  Microscope,
  Image as ImageIcon,
  Stethoscope,
  Building2,
  BarChart3,
  UserCog,
  Settings,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
HeartPulse,
  ClipboardPlus,
  History,
  GitCompareArrows,
  BellRing,
} from "lucide-react";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/agendamentos", label: "Agendamentos", icon: Calendar },
  { href: "/turnos", label: "Turnos", icon: Clock },

  { href: "/exames", label: "Exames", icon: Microscope },
  { href: "/imagens", label: "Imagens", icon: ImageIcon },
  { href: "/tecnicos", label: "Técnicos", icon: Stethoscope },
  { href: "/procedencias", label: "Procedências", icon: Building2 },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/utilizadores", label: "Utilizadores", icon: UserCog },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/configuracoes", label: "Configurações", icon: Settings },

  // Portal do Médico
{ href: "/medico", label: "Dashboard Médico", icon: HeartPulse },
  { href: "/medico/solicitar", label: "Solicitar Exame", icon: ClipboardPlus },
  { href: "/medico/acompanhamento", label: "Acompanhamento", icon: History },
  { href: "/medico/comparar", label: "Comparar Exames", icon: GitCompareArrows },
  { href: "/medico/agenda", label: "Agenda", icon: Calendar },
  { href: "/medico/notificacoes", label: "Notificações", icon: BellRing },
];

const sidebarVariants = {
  expanded: { width: 256 },
  collapsed: { width: 64 },
};

const itemVariants = {
  expanded: { opacity: 1, x: 0, display: "block" },
  collapsed: { opacity: 0, x: -10, transitionEnd: { display: "none" } },
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);

  if (!session) return null;

  return (
    <motion.aside
      initial={false}
      animate={collapsed ? "collapsed" : "expanded"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r bg-card/80 shadow-2xl backdrop-blur-xl"
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b shrink-0",
        collapsed ? "justify-center px-2" : "px-4"
      )}>
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="Logo Imagiologia"
            width={36}
            height={36}
            className="rounded-xl shadow-sm shrink-0"
            priority
          />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-sm font-semibold tracking-tight">Imagiologia</span>
                <p className="text-[10px] text-muted-foreground">Gestão Hospitalar</p>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
        {menuItems
          .filter((item) => {
            const modulo = MENU_MODULOS[item.href];
            if (!modulo) return true;
            return temPermissao(session?.user?.role, modulo);
          })
          .map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn(
                "h-5 w-5 shrink-0 transition-transform",
                isActive && "scale-110"
              )} />
              <motion.span
                variants={itemVariants}
                initial={false}
                animate={collapsed ? "collapsed" : "expanded"}
                transition={{ duration: 0.2 }}
                className="truncate"
              >
                {item.label}
              </motion.span>

              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 hidden rounded-md border bg-popover px-2.5 py-1.5 text-xs font-medium shadow-md group-hover:block whitespace-nowrap z-50">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-popover" />
                </div>
              )}

              {/* Active indicator */}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="border-t p-2 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
