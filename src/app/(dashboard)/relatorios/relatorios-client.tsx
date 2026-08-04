"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  Download,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import type { RelatorioResumoGeral, RelatorioPeriodo } from "@/server/actions/relatorios-actions";
import { ModalExportar } from "@/components/ui/modal-exportar";

interface RelatoriosClientProps {
  resumoGeral: RelatorioResumoGeral;
  relatorio: RelatorioPeriodo;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const CHART_COLORS = [
  "#2563EB", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444",
  "#EC4899", "#14B8A6", "#F97316",
];

const SEXO_MAP: Record<string, string> = {
  "Masculino": "M",
  "Feminino": "F",
  "M": "M",
  "F": "F",
};

function abbreviarSexo(sexo: string): string {
  return SEXO_MAP[sexo] || sexo;
}

function formatarDataParaInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function RelatoriosClient({ resumoGeral, relatorio: relatorioInicial }: RelatoriosClientProps) {
  const router = useRouter();
  const now = new Date();

  const [dataInicio, setDataInicio] = useState(
    formatarDataParaInput(new Date(now.getFullYear(), now.getMonth(), 1))
  );
  const [dataFim, setDataFim] = useState(
    formatarDataParaInput(new Date(now.getFullYear(), now.getMonth() + 1, 0))
  );
  const [estadoFilter, setEstadoFilter] = useState("todos");
  const [procedenciaFilter, setProcedenciaFilter] = useState("0");
  const [tecnicoFilter, setTecnicoFilter] = useState("0");
  const [modalidadeFilter, setModalidadeFilter] = useState("0");
  const [loading, setLoading] = useState(false);
  const [relatorio, setRelatorio] = useState<RelatorioPeriodo>(relatorioInicial);
  const [showExportModal, setShowExportModal] = useState(false);

  async function carregarRelatorio() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("dataInicio", dataInicio);
      params.set("dataFim", dataFim);
      if (estadoFilter !== "todos") params.set("estado", estadoFilter);
      if (procedenciaFilter !== "0") params.set("procedenciaId", procedenciaFilter);
      if (tecnicoFilter !== "0") params.set("tecnicoId", tecnicoFilter);
      if (modalidadeFilter !== "0") params.set("tipoExameId", modalidadeFilter);

      const response = await fetch(`/api/relatorios/periodo?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setRelatorio(data);
      }
    } catch {
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const maxModalidade = Math.max(...relatorio.modalidades.map((m) => m.count), 1);
  const maxProcedencia = Math.max(...relatorio.procedencias.map((p) => p.count), 1);

  function handleExport() {
    const data = {
      exportadoEm: new Date().toISOString(),
      periodo: { dataInicio, dataFim },
      filtros: { estado: estadoFilter, procedencia: procedenciaFilter, tecnico: tecnicoFilter },
      relatorio,
      resumoGeral,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${dataInicio}-a-${dataFim}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusCards = [
    {
      title: "Total Exames",
      value: relatorio.totalExames,
      icon: Calendar,
      color: "from-blue-500/20 to-blue-600/10",
      iconBg: "bg-blue-500/10 text-blue-600",
    },
    {
      title: "Atendidos",
      value: relatorio.examesAtendidos,
      icon: CheckCircle2,
      color: "from-emerald-500/20 to-emerald-600/10",
      iconBg: "bg-emerald-500/10 text-emerald-600",
    },
    {
      title: "Pendentes",
      value: relatorio.examesPendentes,
      icon: Clock,
      color: "from-amber-500/20 to-amber-600/10",
      iconBg: "bg-amber-500/10 text-amber-600",
    },
    {
      title: "Cancelados",
      value: relatorio.examesCancelados,
      icon: XCircle,
      color: "from-red-500/20 to-red-600/10",
      iconBg: "bg-red-500/10 text-red-600",
    },
  ];

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
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Análise detalhada do período selecionado
          </p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Exportar Relatório
        </button>
      </motion.div>

      {/* Filtros */}
      <motion.div variants={itemVariants} className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="Pendente">Pendente</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Realizado">Realizado</option>
              <option value="Entregue">Entregue</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Procedência</label>
            <select
              value={procedenciaFilter}
              onChange={(e) => setProcedenciaFilter(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="0">Todas</option>
              {resumoGeral.procedencias.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Técnico</label>
            <select
              value={tecnicoFilter}
              onChange={(e) => setTecnicoFilter(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="0">Todos</option>
              {resumoGeral.tecnicos.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Modalidade</label>
            <select
              value={modalidadeFilter}
              onChange={(e) => setModalidadeFilter(e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              <option value="0">Todas</option>
              {resumoGeral.tiposExame.map((t) => (
                <option key={t.id} value={t.id}>{t.modalidade || t.nome}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={carregarRelatorio}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                A carregar...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Aplicar Filtros
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Status Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusCards.map((card) => {
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
                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                {card.title === "Atendidos" && relatorio.totalExames > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Taxa: {relatorio.taxaAtendimento}%
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Row */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {/* Distribuição por Modalidade */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Distribuição por Modalidade</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Exames realizados por secção</p>
          </div>
          <div className="p-5">
            {relatorio.modalidades.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <div className="space-y-3">
                {relatorio.modalidades.map((item, index) => {
                  const percentage = (item.count / maxModalidade) * 100;
                  return (
                    <div key={item.modalidade} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.tipoExame}</span>
                        <span className="font-semibold text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Distribuição por Procedência */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Distribuição por Procedência</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Origem dos exames realizados</p>
          </div>
          <div className="p-5">
            {relatorio.procedencias.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <div className="space-y-3">
                {relatorio.procedencias.map((item, index) => {
                  const percentage = (item.count / maxProcedencia) * 100;
                  return (
                    <div key={item.procedencia} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.procedencia}</span>
                        <span className="font-semibold text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: CHART_COLORS[(index + 3) % CHART_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tendência Diária / Sexo */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Tendência Diária */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Tendência Diária</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Exames realizados por dia no período</p>
          </div>
          <div className="p-5">
            {relatorio.tendenciaDiaria.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={relatorio.tendenciaDiaria}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="dia"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickFormatter={(value) => value.split("-").slice(1).join("/")}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      fontSize: "13px",
                    }}
                    labelFormatter={(label) => {
                      const [y, m, d] = label.split("-");
                      return `${d}/${m}/${y}`;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2563EB"
                    strokeWidth={2.5}
                    dot={{ fill: "#2563EB", strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Distribuição por Técnico */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Exames por Técnico</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Desempenho individual dos técnicos</p>
          </div>
          <div className="p-5">
            {relatorio.tecnicos.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <div className="space-y-3">
                {relatorio.tecnicos.map((item, index) => {
                  const maxTecnico = Math.max(...relatorio.tecnicos.map((t) => t.count), 1);
                  const percentage = (item.count / maxTecnico) * 100;
                  return (
                    <div key={item.tecnico} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.tecnico}</span>
                        <span className="font-semibold text-muted-foreground">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: CHART_COLORS[(index + 5) % CHART_COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Sexo mais atendido */}
      {relatorio.totalSexoMapeado > 0 && (
        <motion.div variants={itemVariants} className="rounded-xl border bg-card">
          <div className="border-b px-5 py-4">
            <h2 className="font-semibold">Distribuição por Sexo</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pacientes por sexo no período</p>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(relatorio.contagemSexo).map(([sexo, count]) => ({
                    name: abbreviarSexo(sexo),
                    value: count,
                  }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {Object.entries(relatorio.contagemSexo).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: "13px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-6 mt-2">
              {Object.entries(relatorio.contagemSexo).map(([sexo, count], index) => (
                <div key={sexo} className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {sexo}: <strong>{count}</strong>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal Exportar */}
      <ModalExportar
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        relatorio={relatorio}
        filtros={{
          dataInicio,
          dataFim,
          estado: estadoFilter,
          procedencia: procedenciaFilter !== "0" ? resumoGeral.procedencias.find(p => p.id.toString() === procedenciaFilter)?.nome : undefined,
          tecnico: tecnicoFilter !== "0" ? resumoGeral.tecnicos.find(t => t.id.toString() === tecnicoFilter)?.nome : undefined,
          modalidade: modalidadeFilter !== "0" ? resumoGeral.tiposExame.find(t => t.id.toString() === modalidadeFilter)?.modalidade || resumoGeral.tiposExame.find(t => t.id.toString() === modalidadeFilter)?.nome : undefined,
        }}
      />
    </motion.div>
  );
}

