"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import {
  Calendar,
  Clock,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Search,
  Loader2,
  User,
  Sun,
  Moon,
  Sunset,
  X,
  Download,
  FileText,
  FileSpreadsheet,
  FileDown,
  LayoutGrid,
  Printer,
} from "lucide-react";
import { criarTurno, atualizarTurno, eliminarTurno } from "@/server/actions/turnos-actions";
import { ESTADOS_TURNO, TIPOS_TURNO } from "@/types";
import { usePermissoes } from "@/hooks/use-permissoes";
import {
  exportarEscalaPDF,
  exportarEscalaExcel,
  exportarEscalaWord,
} from "@/features/turnos/services/exportar-escala";

interface TecnicoOption {
  id: number;
  nome: string;
  especialidade: string | null;
}

interface TurnoData {
  id: number;
  tecnicoId: number;
  data: string;
  horaInicio: string;
  horaFim: string;
  tipo: string;
  estado: string;
  observacao: string | null;
  createdById: number | null;
  tecnico: { id: number; nome: string; especialidade: string | null } | null;
  createdBy: { id: number; nome: string } | null;
}

interface TurnosClientProps {
  turnos: TurnoData[];
  tecnicos: TecnicoOption[];
}

const tiposTurnoConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  Manhã: { label: "Manhã", icon: Sun, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30" },
  Tarde: { label: "Tarde", icon: Sunset, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/30" },
  Noite: { label: "Noite", icon: Moon, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/30" },
  Normal: { label: "Normal", icon: Clock, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30" },
};

const estadoColors: Record<string, string> = {
  Agendado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Em curso": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Concluído: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const estadoBorderColors: Record<string, string> = {
  Agendado: "border-l-blue-500 bg-blue-50/30 dark:bg-blue-950/20",
  "Em curso": "border-l-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/20",
  Concluído: "border-l-green-500 bg-green-50/30 dark:bg-green-950/20",
  Cancelado: "border-l-red-500 bg-red-50/30 dark:bg-red-950/20",
};

const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];
const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function TurnosClient({ turnos, tecnicos }: TurnosClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [aba, setAba] = useState<"gestao" | "escala">("gestao");
  const [dataAtual, setDataAtual] = useState(new Date());
  const [search, setSearch] = useState("");
  const [filtroTecnico, setFiltroTecnico] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

// Export state
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportando, setExportando] = useState<string | null>(null);

  // Paginação dos turnos do dia selecionado
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Form state
  const [formData, setFormData] = useState({
    tecnicoId: "",
    data: "",
    horaInicio: "",
    horaFim: "",
    tipo: "Normal",
    estado: "Agendado",
    observacao: "",
  });

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const diaSemanaInicio = primeiroDia.getDay();

  const mesAnterior = useCallback(() => {
    setDataAtual(new Date(ano, mes - 1, 1));
  }, [ano, mes]);

  const mesSeguinte = useCallback(() => {
    setDataAtual(new Date(ano, mes + 1, 1));
  }, [ano, mes]);

  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;

  // Filtrar turnos
  const turnosFiltrados = useMemo(() => {
    let result = [...turnos];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.tecnico?.nome.toLowerCase().includes(q) ||
          t.tipo.toLowerCase().includes(q) ||
          t.estado.toLowerCase().includes(q) ||
          t.observacao?.toLowerCase().includes(q)
      );
    }

    if (filtroTecnico) {
      result = result.filter((t) => t.tecnico?.nome === filtroTecnico);
    }

    if (filtroEstado) {
      result = result.filter((t) => t.estado === filtroEstado);
    }

    return result;
  }, [turnos, search, filtroTecnico, filtroEstado]);

  // Agrupar turnos por dia
  const turnosPorDia = useMemo(() => {
    const map: Record<string, TurnoData[]> = {};
    turnosFiltrados.forEach((turno) => {
      const data = new Date(turno.data);
      const key = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
      if (!map[key]) map[key] = [];
      map[key].push(turno);
    });
    return map;
  }, [turnosFiltrados]);

  const diasCalendario = useMemo(() => {
    const dias: Array<{
      dia: number;
      dataStr: string;
      isHoje: boolean;
      isOutroMes: boolean;
      turnos: TurnoData[];
    }> = [];

    const diasMesAnterior = diaSemanaInicio;
    const mesAnteriorDate = new Date(ano, mes, 0);
    const diasNoMesAnterior = mesAnteriorDate.getDate();

    for (let i = diasMesAnterior - 1; i >= 0; i--) {
      const dia = diasNoMesAnterior - i;
      const dataStr = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      dias.push({ dia, dataStr, isHoje: false, isOutroMes: true, turnos: [] });
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      dias.push({
        dia,
        dataStr,
        isHoje: dataStr === hojeStr,
        isOutroMes: false,
        turnos: turnosPorDia[dataStr] || [],
      });
    }

    const diasRestantes = 42 - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const mesSeguinteNum = mes + 2 > 12 ? 1 : mes + 2;
      const anoSeguinte = mes + 2 > 12 ? ano + 1 : ano;
      const dataStr = `${anoSeguinte}-${String(mesSeguinteNum).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      dias.push({ dia, dataStr, isHoje: false, isOutroMes: true, turnos: [] });
    }

    return dias;
  }, [ano, mes, diasNoMes, diaSemanaInicio, turnosPorDia, hojeStr]);

  // Dias do mês (sem dias de outros meses) e técnicos com turnos no mês
  const diasDoMes = useMemo(
    () => diasCalendario.filter((d) => !d.isOutroMes),
    [diasCalendario]
  );

  const tecnicosComTurnos = useMemo(
    () => tecnicos.filter((t) => turnosFiltrados.some((turno) => turno.tecnicoId === t.id)),
    [tecnicos, turnosFiltrados]
  );

  function handleFormChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setFormData({
      tecnicoId: "",
      data: "",
      horaInicio: "",
      horaFim: "",
      tipo: "Normal",
      estado: "Agendado",
      observacao: "",
    });
    setEditingId(null);
  }

  function openEditModal(turno: TurnoData) {
    const dataObj = new Date(turno.data);
    const dataStr = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, "0")}-${String(dataObj.getDate()).padStart(2, "0")}`;
    setFormData({
      tecnicoId: String(turno.tecnicoId),
      data: dataStr,
      horaInicio: turno.horaInicio,
      horaFim: turno.horaFim,
      tipo: turno.tipo,
      estado: turno.estado,
      observacao: turno.observacao || "",
    });
    setEditingId(turno.id);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const dataPayload = {
        tecnicoId: parseInt(formData.tecnicoId),
        data: formData.data,
        horaInicio: formData.horaInicio,
        horaFim: formData.horaFim,
        tipo: formData.tipo,
        estado: formData.estado,
        observacao: formData.observacao || null,
      };

      if (editingId) {
        await atualizarTurno(editingId, dataPayload);
        toast.success("Turno atualizado com sucesso!");
      } else {
        await criarTurno(dataPayload);
        toast.success("Turno criado com sucesso!");
      }

      setModalOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Erro ao guardar turno");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Eliminar este turno?")) return;
    try {
      await eliminarTurno(id);
      toast.success("Turno eliminado");
      router.refresh();
    } catch {
      toast.error("Erro ao eliminar turno");
    }
  }

const temFiltros = search || filtroTecnico || filtroEstado;

  const turnosDiaSelecionado = useMemo(
    () => (diaSelecionado ? turnosPorDia[diaSelecionado] || [] : []),
    [diaSelecionado, turnosPorDia]
  );

  const totalPagesTurnos = Math.max(1, Math.ceil(turnosDiaSelecionado.length / pageSize));
  const paginaSeguraTurnos = Math.min(currentPage, totalPagesTurnos);
  const turnosPaginados = useMemo(() => {
    const inicio = (paginaSeguraTurnos - 1) * pageSize;
    return turnosDiaSelecionado.slice(inicio, inicio + pageSize);
  }, [turnosDiaSelecionado, paginaSeguraTurnos, pageSize]);

  async function handleExport(formato: string) {
    setExportando(formato);
    try {
      const filtros = {
        mes: String(mes + 1),
        ano: String(ano),
        tecnico: filtroTecnico || undefined,
        estado: filtroEstado || undefined,
      };

      // Use the filtered turnos for export
      const turnosParaExportar = turnosFiltrados.map((t) => ({
        ...t,
        data: new Date(t.data).toISOString(),
      }));

      switch (formato) {
        case "pdf":
          exportarEscalaPDF(turnosParaExportar, filtros);
          break;
        case "excel":
          exportarEscalaExcel(turnosParaExportar, filtros);
          break;
        case "word":
          await exportarEscalaWord(turnosParaExportar, filtros);
          break;
      }
      toast.success(`Escala exportada em ${formato.toUpperCase()}`);
      setExportModalOpen(false);
    } catch (error) {
      console.error(`Erro ao exportar ${formato}:`, error);
      toast.error("Erro ao exportar escala");
    } finally {
      setExportando(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Turnos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {aba === "gestao"
              ? `${meses[mes]} ${ano} · ${turnos.length} turno(s)`
              : `${meses[mes]} ${ano} · ${turnosFiltrados.length} turno(s) · ${new Set(turnosFiltrados.map((t) => t.tecnicoId)).size} técnico(s)`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {aba === "escala" && (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          )}
          <button
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          {aba === "gestao" && pode("turnos", "criar") && (
            <button
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo Turno
            </button>
          )}
        </div>
      </div>

      {/* Tabs Gestão / Escala */}
      <div className="flex gap-1 rounded-lg border bg-card p-1">
        <button
          onClick={() => setAba("gestao")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
            aba === "gestao"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <Clock className="h-4 w-4" />
          Gestão
        </button>
        <button
          onClick={() => setAba("escala")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
            aba === "escala"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          Escala
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar técnico, tipo, estado..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <select
          value={filtroTecnico}
          onChange={(e) => setFiltroTecnico(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2.5 text-sm"
        >
          <option value="">Todos os técnicos</option>
          {tecnicos.map((t) => (
            <option key={t.id} value={t.nome}>{t.nome}</option>
          ))}
        </select>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2.5 text-sm"
        >
          <option value="">Todos os estados</option>
          {ESTADOS_TURNO.map((est) => (
            <option key={est.value} value={est.value}>{est.label}</option>
          ))}
        </select>
        {temFiltros && (
          <button
            onClick={() => { setSearch(""); setFiltroTecnico(""); setFiltroEstado(""); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Content: Gestão */}
      {aba === "gestao" && (
        <>
          {/* Calendar */}
          <div className="rounded-xl border bg-card">
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
                onClick={() => {
                  const hoje = new Date();
                  setDataAtual(hoje);
                }}
                className="rounded-lg px-3 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Hoje
              </button>
              <button
                onClick={mesSeguinte}
                className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {diasSemana.map((dia) => (
                  <div key={dia} className="text-center text-xs font-medium text-muted-foreground py-2">
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

                    <div className="mt-1 space-y-0.5">
                      {diaInfo.turnos.slice(0, 2).map((turno) => {
                        const tipoConf = tiposTurnoConfig[turno.tipo] || tiposTurnoConfig.Normal;
                        return (
                          <div
                            key={turno.id}
                            className={cn(
                              "text-[10px] leading-tight truncate rounded-sm px-1 py-0.5 font-medium",
                              tipoConf.color
                            )}
                            title={`${turno.tecnico?.nome || "N/A"} (${turno.horaInicio}-${turno.horaFim})`}
                          >
                            {turno.tecnico?.nome?.split(" ")[0] || "---"}
                          </div>
                        );
                      })}
                      {diaInfo.turnos.length > 2 && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          +{diaInfo.turnos.length - 2} mais
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Turnos do dia selecionado */}
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
                    Turnos - {diaSelecionado}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {turnosDiaSelecionado.length} turno(s)
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
                {turnosDiaSelecionado.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2" />
                    <p className="text-sm">Nenhum turno para este dia</p>
{pode("turnos", "criar") && (
                      <button
                        onClick={() => {
                          resetForm();
                          setFormData((prev) => ({ ...prev, data: diaSelecionado }));
                          setModalOpen(true);
                        }}
                        className="mt-2 text-xs font-medium text-primary hover:underline"
                      >
                        Agendar turno
                      </button>
                    )}
                  </div>
) : (
                  turnosPaginados.map((turno) => {
                    const TipoIcon = tiposTurnoConfig[turno.tipo]?.icon || Clock;
                    return (
                      <div
                        key={turno.id}
                        className={cn(
                          "flex items-center gap-4 px-5 py-3 border-l-4 hover:bg-muted/30 transition-colors",
                          estadoBorderColors[turno.estado] || "border-l-transparent"
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {turno.tecnico?.nome || "Técnico"}
                            </span>
                            <span className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-medium",
                              estadoColors[turno.estado] || "bg-muted text-muted-foreground"
                            )}>
                              {turno.estado}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {turno.horaInicio} - {turno.horaFim}
                            </span>
                            <span className={cn(
                              "text-xs flex items-center gap-1 rounded-full px-1.5 py-0.5",
                              tiposTurnoConfig[turno.tipo]?.color || "text-muted-foreground"
                            )}>
                              <TipoIcon className="h-3 w-3" />
                              {turno.tipo}
                            </span>
                            {turno.tecnico?.especialidade && (
                              <span className="text-xs text-muted-foreground">
                                {turno.tecnico.especialidade}
                              </span>
                            )}
                          </div>
                          {turno.observacao && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {turno.observacao}
                            </p>
                          )}
                        </div>
<div className="flex items-center gap-1 shrink-0">
                          {pode("turnos", "editar") && (
                            <button
                              onClick={() => openEditModal(turno)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                              title="Editar turno"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                          )}
                          {pode("turnos", "eliminar") && (
                            <button
                              onClick={() => handleDelete(turno.id)}
                              className="rounded-lg p-1.5 text-destructive hover:bg-destructive/10 transition-colors"
                              title="Eliminar turno"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
})
                )}
              </div>

              {turnosDiaSelecionado.length > pageSize && (
                <Pagination
                  currentPage={paginaSeguraTurnos}
                  totalPages={totalPagesTurnos}
                  total={turnosDiaSelecionado.length}
                  onPageChange={setCurrentPage}
                  pageSize={pageSize}
                />
              )}
            </motion.div>
          )}

          {/* Legenda */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>Legenda:</span>
            <span className="flex items-center gap-1">
              <Sun className="h-3 w-3 text-amber-500" /> Manhã
            </span>
            <span className="flex items-center gap-1">
              <Sunset className="h-3 w-3 text-orange-500" /> Tarde
            </span>
            <span className="flex items-center gap-1">
              <Moon className="h-3 w-3 text-indigo-500" /> Noite
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-500" /> Normal
            </span>
            <span className="mx-2 text-muted-foreground/30">|</span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-400" /> Agendado
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-400" /> Em curso
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400" /> Concluído
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-400" /> Cancelado
            </span>
          </div>
        </>
      )}

      {/* Content: Escala */}
      {aba === "escala" && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <button
              onClick={mesAnterior}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{meses[mes]} {ano}</h2>
              <button
                onClick={() => {
                  const hoje = new Date();
                  setDataAtual(hoje);
                }}
                className="rounded-lg px-3 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                Hoje
              </button>
            </div>
            <button
              onClick={mesSeguinte}
              className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="p-4">
            {turnosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                <LayoutGrid className="h-12 w-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum turno encontrado</p>
                <p className="text-xs mt-1">Tente ajustar os filtros ou criar novos turnos.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  className="table-fixed w-full border-separate border-spacing-0 text-sm"
                  style={{ minWidth: 180 + diasDoMes.length * 72 + "px" }}
                >
                  <thead>
                    <tr>
                      <th className="sticky left-0 z-10 bg-card text-left py-2.5 px-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider border-r border-b w-[180px] min-w-[180px]">
                        Técnico
                      </th>
                      {diasDoMes.map((d) => (
                        <th
                          key={d.dataStr}
                          className={cn(
                            "text-center py-2.5 px-1 font-semibold text-xs uppercase tracking-wider w-[72px] min-w-[72px] border-r border-b",
                            d.isHoje && "text-primary bg-primary/5"
                          )}
                        >
                          <div className="flex flex-col items-center">
                            <span>{d.dia}</span>
                            <span className="text-[9px] font-normal text-muted-foreground">
                              {diasSemana[new Date(d.dataStr + "T00:00:00").getDay()] || ""}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tecnicosComTurnos.map((tecnico) => (
                      <tr key={tecnico.id} className="hover:bg-muted/20 transition-colors">
                        <td className="sticky left-0 z-10 bg-card py-2.5 px-3 font-medium whitespace-nowrap border-r border-b w-[180px] min-w-[180px]">
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{tecnico.nome}</span>
                          </div>
                        </td>
                        {diasDoMes.map((d) => {
                          const turnosDoDia = d.turnos.filter((t) => t.tecnicoId === tecnico.id);
                          const turno = turnosDoDia[0];
                          return (
                            <td
                              key={`${tecnico.id}-${d.dataStr}`}
                              className={cn(
                                "text-center py-2 px-1 text-xs border-r border-b align-top h-[52px] w-[72px] min-w-[72px]",
                                d.isHoje && "bg-primary/5"
                              )}
                            >
                              {turno ? (
                                <div
                                  className={cn(
                                    "rounded p-1 leading-tight min-h-[40px] flex flex-col items-center justify-center",
                                    turno.estado === "Concluído" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                    turno.estado === "Agendado" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                                    turno.estado === "Em curso" && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                                    turno.estado === "Cancelado" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                                  )}
                                  title={`${turno.horaInicio}-${turno.horaFim} · ${turno.tipo}`}
                                >
                                  <div className="font-medium text-[10px] whitespace-nowrap">{turno.horaInicio}-{turno.horaFim}</div>
                                  <div className="text-[8px] opacity-75 truncate max-w-full">{turno.tipo}</div>
                                </div>
                              ) : (
                                <span className="text-muted-foreground/30">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Novo/Editar Turno */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          resetForm();
        }}
        title={editingId ? "Editar Turno" : "Novo Turno"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Técnico */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Técnico *</label>
            <select
              required
              value={formData.tecnicoId}
              onChange={(e) => handleFormChange("tecnicoId", e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="">Selecione um técnico</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome} {t.especialidade ? `(${t.especialidade})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Data do Turno *</label>
            <input
              type="date"
              required
              value={formData.data}
              onChange={(e) => handleFormChange("data", e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Hora Início e Fim */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Hora de Início *</label>
              <input
                type="time"
                required
                value={formData.horaInicio}
                onChange={(e) => handleFormChange("horaInicio", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Hora de Fim *</label>
              <input
                type="time"
                required
                value={formData.horaFim}
                onChange={(e) => handleFormChange("horaFim", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Tipo e Estado */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Tipo de Turno</label>
              <select
                value={formData.tipo}
                onChange={(e) => handleFormChange("tipo", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {TIPOS_TURNO.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Estado</label>
              <select
                value={formData.estado}
                onChange={(e) => handleFormChange("estado", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {ESTADOS_TURNO.map((est) => (
                  <option key={est.value} value={est.value}>{est.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Observação */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Observações</label>
            <textarea
              rows={2}
              placeholder="Notas ou observações sobre o turno..."
              value={formData.observacao}
              onChange={(e) => handleFormChange("observacao", e.target.value)}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm resize-none focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                resetForm();
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {submitting ? "A guardar..." : editingId ? "Atualizar Turno" : "Criar Turno"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Exportar Escala */}
      <Modal
        open={exportModalOpen}
        onClose={() => {
          setExportModalOpen(false);
          setExportando(null);
        }}
        title="Exportar Escala de Turnos"
        size="md"
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Escolha o formato para exportar a escala de turnos de <strong>{meses[mes]} {ano}</strong>
            {turnosFiltrados.length < turnos.length && (
              <span className="block mt-1 text-xs">
                (a exportar {turnosFiltrados.length} turno(s) com os filtros aplicados)
              </span>
            )}
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {/* PDF */}
            <button
              onClick={() => handleExport("pdf")}
              disabled={exportando !== null}
              className={cn(
                "group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all",
                "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                "bg-red-50 border-red-200 hover:bg-red-100",
                exportando === "pdf" && "ring-2 ring-red-500"
              )}
            >
              {exportando === "pdf" ? (
                <Loader2 className="h-10 w-10 animate-spin text-red-600" />
              ) : (
                <FileText className="h-10 w-10 text-red-600" />
              )}
              <div>
                <p className="font-semibold text-sm">PDF</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Documento profissional formatado com tabelas e resumo
                </p>
              </div>
              {exportando === "pdf" && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  A exportar...
                </span>
              )}
            </button>

            {/* Excel */}
            <button
              onClick={() => handleExport("excel")}
              disabled={exportando !== null}
              className={cn(
                "group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all",
                "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
                exportando === "excel" && "ring-2 ring-emerald-500"
              )}
            >
              {exportando === "excel" ? (
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
              )}
              <div>
                <p className="font-semibold text-sm">Excel</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Planilha com múltiplas abas organizadas por categoria
                </p>
              </div>
              {exportando === "excel" && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  A exportar...
                </span>
              )}
            </button>

            {/* Word */}
            <button
              onClick={() => handleExport("word")}
              disabled={exportando !== null}
              className={cn(
                "group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all",
                "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                "bg-blue-50 border-blue-200 hover:bg-blue-100",
                exportando === "word" && "ring-2 ring-blue-500"
              )}
            >
              {exportando === "word" ? (
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              ) : (
                <FileDown className="h-10 w-10 text-blue-600" />
              )}
              <div>
                <p className="font-semibold text-sm">Word</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Documento editável com secções e tabelas formatadas
                </p>
              </div>
              {exportando === "word" && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  A exportar...
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              {turnosFiltrados.length} turno(s) · {new Set(turnosFiltrados.map((t) => t.tecnicoId)).size} técnico(s)
            </p>
            <button
              onClick={() => {
                setExportModalOpen(false);
                setExportando(null);
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

