"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { formatDate, formatDateTime } from "@/utils/format";
import { toast } from "sonner";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  Microscope,
  Building2,
  Search,
  Filter,
  Stethoscope,
  Loader2,
  FileText,
  X,
  Check,
} from "lucide-react";
import { criarExame } from "@/server/actions/exames-actions";
import { usePermissoes } from "@/hooks/use-permissoes";
import { Pagination } from "@/components/ui/pagination";

interface PacienteOption {
  id: number;
  nome: string;
  numeroProcesso: string;
}

interface TipoExameOption {
  id: number;
  nome: string;
  modalidade: string | null;
  duracaoMin: number | null;
}

interface TecnicoOption {
  id: number;
  nome: string;
}

interface ProcedenciaOption {
  id: number;
  nome: string;
}

interface ExameAgendamento {
  id: number;
  codigo: string | null;
  pacienteId: number;
  tipoExameId: number;
  tecnicoId: number | null;
  procedenciaId: number | null;
  medicoSolicitante: string | null;
  observacao: string | null;
  estado: string;
  dataExame: string;
  paciente: { id: number; nome: string; numeroProcesso: string };
  tipoExame: { id: number; nome: string; modalidade: string | null; duracaoMin: number | null };
  tecnico: { id: number; nome: string } | null;
  procedencia: { id: number; nome: string } | null;
}

interface AgendamentosClientProps {
  exames: ExameAgendamento[];
  pacientes: PacienteOption[];
  tiposExame: TipoExameOption[];
  tecnicos: TecnicoOption[];
  procedencias: ProcedenciaOption[];
}

const statusColors: Record<string, string> = {
  Pendente: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/30",
  "Em andamento": "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30",
  Realizado: "border-l-green-500 bg-green-50 dark:bg-green-950/30",
  Entregue: "border-l-purple-500 bg-purple-50 dark:bg-purple-950/30",
  Cancelado: "border-l-red-500 bg-red-50 dark:bg-red-950/30",
};

const statusBadgeColors: Record<string, string> = {
  Pendente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Em andamento": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Realizado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Entregue: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function AgendamentosClient({
  exames,
  pacientes,
  tiposExame,
  tecnicos,
  procedencias,
}: AgendamentosClientProps) {
const router = useRouter();
  const { pode } = usePermissoes();
  const [dataAtual, setDataAtual] = useState(new Date());
  const [search, setSearch] = useState("");
  const [filtroProcedencia, setFiltroProcedencia] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal de novo agendamento
  const [showNovoAgendamento, setShowNovoAgendamento] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    pacienteId: "",
    tipoExameId: "",
    procedenciaId: "",
    tecnicoId: "",
    dataExame: "",
    horaExame: "",
    medicoSolicitante: "",
    observacao: "",
  });

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const diaSemanaInicio = primeiroDia.getDay();

  // Navegacao mes
  const mesAnterior = useCallback(() => {
    setDataAtual(new Date(ano, mes - 1, 1));
  }, [ano, mes]);

  const mesSeguinte = useCallback(() => {
    setDataAtual(new Date(ano, mes + 1, 1));
  }, [ano, mes]);

  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  // Filtrar exames
  const examesFiltrados = useMemo(() => {
    let result = [...exames];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.paciente.nome.toLowerCase().includes(q) ||
          e.tipoExame.nome.toLowerCase().includes(q) ||
          e.codigo?.toLowerCase().includes(q) ||
          e.medicoSolicitante?.toLowerCase().includes(q)
      );
    }

    if (filtroProcedencia) {
      result = result.filter((e) => e.procedencia?.nome === filtroProcedencia);
    }

    if (filtroEstado) {
      result = result.filter((e) => e.estado === filtroEstado);
    }

    return result;
  }, [exames, search, filtroProcedencia, filtroEstado]);

  // Agrupar exames por dia
  const examesPorDia = useMemo(() => {
    const map: Record<string, ExameAgendamento[]> = {};
    examesFiltrados.forEach((exame) => {
      const data = new Date(exame.dataExame);
      const key = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(exame);
    });
    return map;
  }, [examesFiltrados]);

  const diasCalendario = useMemo(() => {
    const dias: Array<{
      dia: number;
      dataStr: string;
      isHoje: boolean;
      isOutroMes: boolean;
      exames: ExameAgendamento[];
    }> = [];

    // Dias do mes anterior para preencher inicio
    const diasMesAnterior = diaSemanaInicio;
    const mesAnteriorDate = new Date(ano, mes, 0);
    const diasNoMesAnterior = mesAnteriorDate.getDate();

    for (let i = diasMesAnterior - 1; i >= 0; i--) {
      const dia = diasNoMesAnterior - i;
      const dataStr = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      dias.push({
        dia,
        dataStr,
        isHoje: false,
        isOutroMes: true,
        exames: [],
      });
    }

    // Dias do mes atual
    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      dias.push({
        dia,
        dataStr,
        isHoje: dataStr === hojeStr,
        isOutroMes: false,
        exames: examesPorDia[dataStr] || [],
      });
    }

    // Dias do mes seguinte para completar
    const diasRestantes = 42 - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const mesSeguinte = mes + 2 > 12 ? 1 : mes + 2;
      const anoSeguinte = mes + 2 > 12 ? ano + 1 : ano;
      const dataStr = `${anoSeguinte}-${String(mesSeguinte).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      dias.push({
        dia,
        dataStr,
        isHoje: false,
        isOutroMes: true,
        exames: [],
      });
    }

    return dias;
  }, [ano, mes, diasNoMes, diaSemanaInicio, examesPorDia, hojeStr]);

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const dataExame = formData.dataExame
        ? `${formData.dataExame}T${formData.horaExame || "09:00"}:00.000Z`
        : new Date().toISOString();

      await criarExame({
        pacienteId: parseInt(formData.pacienteId),
        tipoExameId: parseInt(formData.tipoExameId),
        procedenciaId: formData.procedenciaId ? parseInt(formData.procedenciaId) : null,
        tecnicoId: formData.tecnicoId ? parseInt(formData.tecnicoId) : null,
        medicoSolicitante: formData.medicoSolicitante || null,
        observacao: formData.observacao || null,
        estado: "Pendente",
        dataExame,
      });

      toast.success("Agendamento criado com sucesso!");
      setShowNovoAgendamento(false);
      setFormData({
        pacienteId: "",
        tipoExameId: "",
        procedenciaId: "",
        tecnicoId: "",
        dataExame: "",
        horaExame: "",
        medicoSolicitante: "",
        observacao: "",
      });
      router.refresh();
    } catch (error) {
      toast.error("Erro ao criar agendamento");
    } finally {
      setSubmitting(false);
    }
  };

  const limparFiltros = () => {
    setSearch("");
    setFiltroProcedencia("");
    setFiltroEstado("");
  };

  const temFiltros = search || filtroProcedencia || filtroEstado;

  // Agendamentos do dia selecionado
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agendamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meses[mes]} {ano} &middot; {exames.length} exame(s) agendados
          </p>
        </div>
        {pode("agendamentos", "criar") && (
          <button
            onClick={() => setShowNovoAgendamento(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar paciente, exame, medico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
            temFiltros
              ? "border-primary bg-primary/5 text-primary"
              : "border-input text-muted-foreground hover:bg-accent"
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros
          {temFiltros && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {(search ? 1 : 0) + (filtroProcedencia ? 1 : 0) + (filtroEstado ? 1 : 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="rounded-xl border bg-card p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Filtrar Agendamentos</span>
            {temFiltros && (
              <button
                onClick={limparFiltros}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar filtros
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Procedencia / Unidade</label>
              <select
                value={filtroProcedencia}
                onChange={(e) => setFiltroProcedencia(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Todas as unidades</option>
                {procedencias.map((p) => (
                  <option key={p.id} value={p.nome}>{p.nome}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Todos os estados</option>
                <option value="Pendente">Pendente</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Realizado">Realizado</option>
                <option value="Entregue">Entregue</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Pesquisa</label>
              <input
                type="text"
                placeholder="Nome, exame, medico..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Calendar */}
      <div className="rounded-xl border bg-card">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <button
            onClick={mesAnterior}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold">
            {meses[mes]} {ano}
          </h2>
          <button
            onClick={mesSeguinte}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {diasSemana.map((dia) => (
              <div
                key={dia}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {dia}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {diasCalendario.map((diaInfo, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDiaSelecionado(
                    diaSelecionado === diaInfo.dataStr ? null : diaInfo.dataStr
                  );
                }}
                disabled={diaInfo.isOutroMes}
                className={cn(
                  "relative min-h-[90px] rounded-lg border p-1.5 text-left transition-all",
                  diaInfo.isOutroMes
                    ? "opacity-30 cursor-default"
                    : "hover:border-primary/30 hover:bg-accent/30 cursor-pointer",
                  diaInfo.isHoje && "border-primary/50 bg-primary/5",
                  diaSelecionado === diaInfo.dataStr && "ring-2 ring-primary",
                  !diaInfo.isOutroMes && "bg-card"
                )}
              >
                <span
                  className={cn(
                    "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    diaInfo.isHoje && "bg-primary text-primary-foreground"
                  )}
                >
                  {diaInfo.dia}
                </span>

                {/* Exames do dia */}
                <div className="mt-1 space-y-0.5">
                  {diaInfo.exames.slice(0, 3).map((exame) => (
                    <div
                      key={exame.id}
                      className={cn(
                        "text-[10px] leading-tight truncate rounded-sm px-1 py-0.5 font-medium",
                        exame.estado === "Pendente" && "text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-950/50",
                        exame.estado === "Realizado" && "text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-950/50",
                        exame.estado === "Cancelado" && "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-950/50"
                      )}
                    >
                      {exame.tipoExame.nome.length > 15
                        ? exame.tipoExame.nome.substring(0, 14) + "..."
                        : exame.tipoExame.nome}
                    </div>
                  ))}
                  {diaInfo.exames.length > 3 && (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      +{diaInfo.exames.length - 3} mais
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de agendamentos do dia selecionado */}
      {diaSelecionado && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">
                Agendamentos - {diaSelecionado}
              </h3>
              <span className="text-xs text-muted-foreground">
                {(examesPorDia[diaSelecionado] || []).length} exame(s)
              </span>
            </div>
            <button
              onClick={() => setDiaSelecionado(null)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

<div className="divide-y">
            {(() => {
              const examesDoDia = examesPorDia[diaSelecionado] || [];
              const totalPages = Math.max(1, Math.ceil(examesDoDia.length / pageSize));
              const paginaSegura = Math.min(currentPage, totalPages);
              const inicio = (paginaSegura - 1) * pageSize;
              const paginados = examesDoDia.slice(inicio, inicio + pageSize);

              if (examesDoDia.length === 0) {
                return (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2" />
                    <p className="text-sm">Nenhum exame agendado para este dia</p>
                    {pode("agendamentos", "criar") && (
                      <button
                        onClick={() => {
                          setShowNovoAgendamento(true);
                          setFormData((prev) => ({ ...prev, dataExame: diaSelecionado }));
                        }}
                        className="mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        Agendar exame
                      </button>
                    )}
                  </div>
                );
              }

              return paginados.map((exame) => (
                <div
                  key={exame.id}
                  className={cn(
                    "flex items-center gap-4 px-5 py-3 border-l-4 hover:bg-muted/30 transition-colors cursor-pointer",
                    statusColors[exame.estado] || "border-l-transparent"
                  )}
                  onClick={() => router.push(`/exames/${exame.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {exame.paciente.nome}
                      </span>
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-medium",
                        statusBadgeColors[exame.estado] || "bg-muted text-muted-foreground"
                      )}>
                        {exame.estado}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Microscope className="h-3 w-3" />
                        {exame.tipoExame.nome}
                      </span>
                      {exame.procedencia && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {exame.procedencia.nome}
                        </span>
                      )}
                      {exame.tecnico && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Stethoscope className="h-3 w-3" />
                          {exame.tecnico.nome}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="text-xs text-primary font-medium hover:underline shrink-0"
                  >
                    Ver detalhes
                  </button>
                </div>
              ));
            })()}
          </div>

          <Pagination
            currentPage={Math.min(currentPage, Math.max(1, Math.ceil((examesPorDia[diaSelecionado] || []).length / pageSize)))}
            totalPages={Math.max(1, Math.ceil((examesPorDia[diaSelecionado] || []).length / pageSize))}
            total={(examesPorDia[diaSelecionado] || []).length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </motion.div>
      )}

      {/* Modal Novo Agendamento */}
      {showNovoAgendamento && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl rounded-xl border bg-card shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">Novo Agendamento</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNovoAgendamento(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Paciente */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Paciente *</label>
                  <select
                    required
                    value={formData.pacienteId}
                    onChange={(e) => handleFormChange("pacienteId", e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                  >
                    <option value="">Selecione um paciente</option>
                    {pacientes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} (#{p.numeroProcesso})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Exame */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tipo de Exame *</label>
                  <select
                    required
                    value={formData.tipoExameId}
                    onChange={(e) => handleFormChange("tipoExameId", e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                  >
                    <option value="">Selecione o exame</option>
                    {tiposExame.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} {t.modalidade ? `(${t.modalidade})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Data e Hora */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Data do Exame *</label>
                    <input
                      type="date"
                      required
                      value={formData.dataExame}
                      onChange={(e) => handleFormChange("dataExame", e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Hora</label>
                    <input
                      type="time"
                      value={formData.horaExame}
                      onChange={(e) => handleFormChange("horaExame", e.target.value)}
                      className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                {/* Procedencia / Unidade */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Procedencia / Unidade</label>
                  <select
                    value={formData.procedenciaId}
                    onChange={(e) => handleFormChange("procedenciaId", e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                  >
                    <option value="">Selecione a unidade</option>
                    {procedencias.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    A medica pode selecionar a unidade (procedencia) onde o exame sera realizado
                  </p>
                </div>

                {/* Tecnico */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Tecnico</label>
                  <select
                    value={formData.tecnicoId}
                    onChange={(e) => handleFormChange("tecnicoId", e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                  >
                    <option value="">Selecione o tecnico</option>
                    {tecnicos.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Medico Solicitante */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Medico Solicitante</label>
                  <input
                    type="text"
                    placeholder="Dr. Nome do medico"
                    value={formData.medicoSolicitante}
                    onChange={(e) => handleFormChange("medicoSolicitante", e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                {/* Observacao */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Observacoes</label>
                  <textarea
                    rows={3}
                    placeholder="Notas ou observacoes para o exame..."
                    value={formData.observacao}
                    onChange={(e) => handleFormChange("observacao", e.target.value)}
                    className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-muted/30">
                <button
                  type="button"
                  onClick={() => setShowNovoAgendamento(false)}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {submitting ? "A criar..." : "Criar Agendamento"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-400" />
          Pendente
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          Em andamento
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-400" />
          Realizado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-purple-400" />
          Entregue
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400" />
          Cancelado
        </span>
      </div>
    </motion.div>
  );
}
