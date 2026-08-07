"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  FileText,
  BrainCircuit,
  AlertOctagon,
  BellRing,
  ArrowRight,
  Activity,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";
import type { DashboardCognitivo } from "@/features/cognitivo/types";

const COLORS = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4"];

function LoadingState() {
  return (
    <div className="flex h-64 items-center justify-center text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function CognitivoDashboardClient({ dados }: { dados: DashboardCognitivo }) {
  const stats = [
    { label: "Exames Pendentes", value: dados.examesPendentes, icon: Clock, color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", href: "/cognitivo/linha-temporal" },
    { label: "Exames Concluídos", value: dados.examesConcluidos, icon: CheckCircle2, color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400", href: "/cognitivo/evolucao" },
    { label: "Exames Urgentes", value: dados.examesUrgentes, icon: AlertTriangle, color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400", href: "/cognitivo/linha-temporal" },
    { label: "Pacientes Críticos", value: dados.pacientesCriticos, icon: Users, color: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400", href: "/cognitivo/digital-twin" },
    { label: "Aguardando Laudo", value: dados.aguardandoLaudo, icon: FileText, color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400", href: "/cognitivo/segunda-opiniao" },
    { label: "IA Concluída", value: dados.iaConcluida, icon: BrainCircuit, color: "text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400", href: "/cognitivo/assistente" },
    { label: "Inconsistências", value: dados.inconsistencias, icon: AlertOctagon, color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400", href: "/cognitivo/contradicoes" },
    { label: "Notificações", value: dados.notificacoes, icon: BellRing, color: "text-pink-600 bg-pink-100 dark:bg-pink-900/30 dark:text-pink-400", href: "/cognitivo/ia-generativa" },
  ];

  const modalidadeData = dados.examesPorModalidade.map((m, i) => ({ name: m.modalidade, total: m.total, fill: COLORS[i % COLORS.length] }));
  const mesData = dados.examesPorMes.slice(-12).map((m) => {
    const [y, mo] = m.mes.split("-");
    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return { name: meses[parseInt(mo) - 1], total: m.total };
  });
  const procedenciaData = dados.examesPorProcedencia.map((p, i) => ({ name: p.procedencia, value: p.total, fill: COLORS[i % COLORS.length] }));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            Dashboard Cognitivo
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Inteligência clínica — visão consolidada do serviço de imagiologia.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/cognitivo/ia-generativa" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            <BrainCircuit className="h-4 w-4" /> Perguntar à IA
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Link href={stat.href} className="block rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
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

      {/* Charts row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CognitivoCard title="Exames por Modalidade" subtitle="Distribuição real por tipo de modalidade" action={<Activity className="h-4 w-4 text-muted-foreground" />}>
          {modalidadeData.length === 0 ? <LoadingState /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={modalidadeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 13 }} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {modalidadeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CognitivoCard>

        <CognitivoCard title="Evolução da Demanda" subtitle="Exames por mês (dados reais)">
          {mesData.length === 0 ? <LoadingState /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={mesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 13 }} />
                <Line type="monotone" dataKey="total" stroke="#2563EB" strokeWidth={2.5} dot={{ fill: "#2563EB", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CognitivoCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <CognitivoCard title="Exames por Procedência" subtitle="Origem dos pedidos">
          {procedenciaData.length === 0 ? <LoadingState /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={procedenciaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {procedenciaData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)", fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CognitivoCard>

        <CognitivoCard title="Exames por Médico" subtitle="Solicitantes mais ativos">
          <div className="space-y-3">
            {dados.examesPorMedico.slice(0, 8).map((m, i) => {
              const max = Math.max(...dados.examesPorMedico.map((x) => x.total), 1);
              return (
                <div key={`${m.medico}-${i}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate">{m.medico}</span>
                    <span className="text-muted-foreground">{m.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(m.total / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CognitivoCard>

        <CognitivoCard title="Atividades Recentes" subtitle="Últimas ações no sistema">
          <div className="space-y-3">
            {dados.atividadesRecentes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem atividades recentes.</p>
            ) : (
              dados.atividadesRecentes.slice(0, 8).map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.acao}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{a.descricao || "—"}</p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {a.utilizador?.nome ? `${a.utilizador.nome} · ` : ""}{formatDate(a.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CognitivoCard>
      </div>

      {/* Tempo médio laudo */}
      <CognitivoCard title="Tempo Médio até Laudo" subtitle="Média em dias entre solicitação e laudo">
        <div className="flex items-center gap-6">
          <p className="text-4xl font-bold text-primary">{dados.tempoMedioLaudo}<span className="text-lg text-muted-foreground"> dias</span></p>
          <p className="text-sm text-muted-foreground max-w-md">
            Calculado a partir de {dados.examesPorMes.reduce((a, b) => a + b.total, 0)} exames registados no sistema.
          </p>
        </div>
      </CognitivoCard>
    </motion.div>
  );
}
