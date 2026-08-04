"use client";

import { useState } from "react";
import {
  Users,
  Microscope,
  Calendar,
  Image,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
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
  AreaChart,
  Area,
} from "recharts";

interface DashboardClientProps {
  examesCount: { total: number; hoje: number; esteMes: number };
  modalidades: { modalidade: string; count: number }[];
  examesMensais: { mes: string; total: number }[];
  ultimosExames: any[];
  ultimosPacientes: any[];
  totalPacientes: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

const statusColors: Record<string, string> = {
  Pendente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Em andamento": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Realizado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Entregue: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function DashboardClient({
  examesCount,
  modalidades,
  examesMensais,
  ultimosExames,
  ultimosPacientes,
  totalPacientes,
}: DashboardClientProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<"6" | "12">("6");

  const examesHoje = examesCount.hoje;

  const cards = [
    {
      title: "Pacientes Cadastrados",
      value: totalPacientes,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      color: "from-blue-500/20 to-blue-600/10",
      iconBg: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Exames Realizados",
      value: examesCount.total,
      icon: Microscope,
      trend: "+8%",
      trendUp: true,
      color: "from-emerald-500/20 to-emerald-600/10",
      iconBg: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Exames Hoje",
      value: examesHoje,
      icon: Calendar,
      trend: examesHoje > 0 ? "Hoje" : "Nenhum",
      trendUp: examesHoje > 0,
      color: "from-violet-500/20 to-violet-600/10",
      iconBg: "bg-violet-500/10 text-violet-600",
    },
    {
      title: "Imagens Armazenadas",
      value: "12.5K",
      icon: Image,
      trend: "+3%",
      trendUp: true,
      color: "from-orange-500/20 to-orange-600/10",
      iconBg: "bg-orange-500/10 text-orange-600",
    },
  ];

  const monthlyData = examesMensais.map((item) => {
    const [year, month] = item.mes.split("-");
    const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    return {
      name: months[parseInt(month) - 1],
      total: item.total,
    };
  });

  const modalidadeColors = ["#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"];
  const modalidadeData = modalidades.map((item, i) => ({
    name: item.modalidade,
    exames: item.count,
    fill: modalidadeColors[i % modalidadeColors.length],
  }));

  const maxCount = Math.max(...modalidades.map((m) => m.count), 1);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral do sistema de imagiologia
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["6", "12"].map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period as "6" | "12")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                selectedPeriod === period
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              Últimos {period} meses
            </button>
          ))}
        </div>
      </motion.div>

      {/* Cards */}
      <motion.div
        variants={itemVariants}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              variants={itemVariants}
              whileHover={{ y: -2 }}
              className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-shadow hover:shadow-lg"
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity",
                card.color
              )} />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  <div className={cn("rounded-lg p-2", card.iconBg)}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {card.trendUp ? (
                        <TrendingUp className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <span className={cn(
                        "text-xs font-medium",
                        card.trendUp ? "text-emerald-500" : "text-red-500"
                      )}>
                        {card.trend}
                      </span>
                    </div>
                  </div>
                  {/* Mini sparkline */}
                  <div className="h-10 w-16">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData.slice(-6)}>
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="currentColor"
                          fill="currentColor"
                          fillOpacity={0.1}
                          strokeWidth={1.5}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart - Modalidades */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Exames por Modalidade</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribuição de exames por tipo
            </p>
          </div>
          <div className="p-5">
            {modalidadeData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Nenhum exame registado
              </div>
            ) : (
              <div className="space-y-3">
                {modalidadeData.map((item) => {
                  const percentage = (item.exames / maxCount) * 100;
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.name}</span>
                        <span className="font-semibold text-muted-foreground">{item.exames}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: item.fill }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Line Chart - Mensal */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Exames por Mês</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Evolução mensal de exames realizados
            </p>
          </div>
          <div className="p-5">
            {monthlyData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      fontSize: "13px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ fill: "#2563EB", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </motion.div>

      {/* Bottom Row */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {/* Últimos Exames */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Últimos Exames</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Exames mais recentes</p>
            </div>
            <Link
              href="/exames"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {ultimosExames.length === 0 ? (
              <div className="flex py-8 items-center justify-center text-sm text-muted-foreground">
                Nenhum exame registado
              </div>
            ) : (
              <div className="space-y-2">
                {ultimosExames.map((exame: any) => (
                  <Link
                    key={exame.id}
                    href={`/exames/${exame.id}`}
                    className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                        <Microscope className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {exame.paciente?.nome}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {exame.tipoExame?.nome}
                          {exame.tecnico && ` · ${exame.tecnico.nome}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(exame.dataExame)}
                      </p>
                      <span className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium mt-0.5",
                        statusColors[exame.estado] || "bg-muted text-muted-foreground"
                      )}>
                        {exame.estado}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Últimos Pacientes */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <div>
              <h2 className="font-semibold">Últimos Pacientes</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Pacientes registados recentemente</p>
            </div>
            <Link
              href="/pacientes"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="p-5">
            {ultimosPacientes.length === 0 ? (
              <div className="flex py-8 items-center justify-center text-sm text-muted-foreground">
                Nenhum paciente registado
              </div>
            ) : (
              <div className="space-y-2">
                {ultimosPacientes.map((paciente: any) => (
                  <Link
                    key={paciente.id}
                    href={`/pacientes/${paciente.id}`}
                    className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 shrink-0">
                        <Users className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{paciente.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {paciente._count.exames} exame(s)
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(paciente.createdAt)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Ações Rápidas */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/pacientes/novo", label: "Novo Paciente", icon: Users, color: "from-blue-500/20 to-blue-600/10 text-blue-600" },
          { href: "/exames/novo", label: "Novo Exame", icon: Microscope, color: "from-emerald-500/20 to-emerald-600/10 text-emerald-600" },
          { href: "/relatorios", label: "Relatórios", icon: Calendar, color: "from-violet-500/20 to-violet-600/10 text-violet-600" },
          { href: "/tecnicos", label: "Técnicos", icon: Users, color: "from-orange-500/20 to-orange-600/10 text-orange-600" },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5",
              )}
            >
              <div className={cn("rounded-lg p-2.5 bg-gradient-to-br", item.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
            </Link>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

