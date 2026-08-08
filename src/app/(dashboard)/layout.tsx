"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { GestorChamadas } from "@/features/chamadas-voz/components/gestor-chamadas";
import { AssistenteFlutuante } from "@/components/layout/assistente-flutuante";
import { Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="relative flex h-screen items-center justify-center overflow-hidden bg-background">
        {/* Fundo decorativo */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-[120px] dark:bg-blue-600/20" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-200/30 blur-[120px] dark:bg-cyan-500/10" />
          <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-200/30 blur-[100px] dark:bg-indigo-500/10" />
        </div>
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="relative flex h-screen overflow-hidden bg-background">
      {/* Fundo decorativo premium */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-[120px] dark:bg-blue-600/20" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-200/30 blur-[120px] dark:bg-cyan-500/10" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-200/30 blur-[100px] dark:bg-indigo-500/10" />
        {/* Grid pattern sutil que adapta ao tema */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - desktop: fixed, mobile: overlay */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 z-40 h-screen lg:hidden"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="relative z-10 flex flex-1 flex-col lg:pl-64">
        <Header onMenuClick={() => setMobileOpen(!mobileOpen)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="mx-auto max-w-7xl"
          >
            {children}
          </motion.div>
        </main>
      </div>

      <Toaster position="top-right" richColors closeButton />

      {/* Gestor de chamadas de voz (overlays + sinalização) */}
      <GestorChamadas />

      {/* Assistente flutuante do sistema */}
      <AssistenteFlutuante />
    </div>
  );
}

