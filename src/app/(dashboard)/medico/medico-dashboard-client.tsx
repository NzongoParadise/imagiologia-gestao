"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Microscope,
  ArrowRight,
  Plus,
  FileSignature,
} from "lucide-react";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
import type { IndicadoresMedico } from "@/features/medico/types";

interface Props {
  indicadores: IndicadoresMedico;
}

const prioridadeColors: Record<string, string> = {
  Normal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Prioritário": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Urgente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Emergência": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function MedicoDashboardClient({ indicadores }: Props) {
  const stats = [
    {
      label: "Exames Solicitados",
      value: indicadores.totalSolicitacoes,
      icon: ClipboardList,
      color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
      href: "/medico/acompanhamento",
    },
    {
      label: "Exames Pendentes",
      value: indicadores.examesPendentes,
      icon: Clock,
      color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400",
      href: "/medico/acompanhamento",
    },
    {
      label: "Exames Concluídos",
      value: indicadores.examesConcluidos,
      icon: CheckCircle2,
      color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
      href: "/medico/acompanhamento",
    },
    {
      label: "Exames Urgentes",
      value: indicadores.examesUrgentes,
      icon: AlertTriangle,
      color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
      href: "/medico/acompanhamento",
    },
    {
      label: "Pacientes Aguardando",
      value: indicadores.pacientesAguardando,
      icon: Users,
      color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
      href: "/medico/agenda",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Microscope className="h-6 w-6 text-primary" />
            Portal do Médico
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acompanhe os seus pacientes, solicite exames e consulte resultados.
          </p>
        </div>
        <Link
          href="/medico/solicitar"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Solicitar Exame
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Link
              href={stat.href}
              className="block rounded-xl border bg-card p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
              </div>
              <p className="mt-3 text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Últimas solicitações */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">Últimas Solicitações</h2>
            <p className="text-xs text-muted-foreground">
              Pedidos de exame recentes
            </p>
          </div>
          <Link
            href="/medico/acompanhamento"
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>
        <div className="divide-y">
          {indicadores.ultimasSolicitacoes.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
              <ClipboardList className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm font-medium">Nenhuma solicitação</p>
              <p className="text-xs mt-1">Solicite o primeiro exame.</p>
            </div>
          ) : (
            indicadores.ultimasSolicitacoes.map((exame) => (
              <Link
                key={exame.id}
                href={`/medico/exames/${exame.id}`}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Microscope className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {exame.paciente?.nome || "Paciente"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {exame.tipoExame?.nome || "Exame"} · {exame.codigo || `#${exame.id}`}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                    prioridadeColors[exame.prioridade] || "bg-muted text-muted-foreground"
                  )}>
                    {exame.prioridade}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(exame.dataExame)}
                  </span>
                </div>
                {exame.laudos?.[0]?.assinado ? (
                  <FileSignature className="h-4 w-4 text-green-600" />
                ) : null}
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Distribuição por modalidade */}
      {indicadores.distribuicaoModalidades.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <h2 className="text-sm font-semibold mb-4">Exames por Modalidade (30 dias)</h2>
          <div className="flex flex-wrap gap-2">
            {indicadores.distribuicaoModalidades.map((m) => {
              const max = Math.max(
                ...indicadores.distribuicaoModalidades.map((x) => x.count)
              );
              const pct = Math.round((m.count / max) * 100);
              return (
                <div key={m.modalidade} className="flex-1 min-w-[140px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{m.modalidade}</span>
                    <span className="text-xs text-muted-foreground">{m.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
