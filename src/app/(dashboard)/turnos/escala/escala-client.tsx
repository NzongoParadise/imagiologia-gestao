"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sunset,
  Clock,
  Download,
  Printer,
  Loader2,
  FileText,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
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

interface EscalaClientProps {
  turnos: TurnoData[];
  tecnicos: TecnicoOption[];
}

type VistaEscala = "mes" | "semana";

const TIPO_CORES_BG: Record<string, string> = {
  Manhã: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
  Tarde: "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
  Noite: "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700",
  Normal: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
};

const TIPO_ICONS: Record<string, React.ElementType> = {
  Manhã: Sun,
  Tarde: Sunset,
  Noite: Moon,
  Normal: Clock,
};

const meses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const diasSemanaCurto = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

export function EscalaClient({ turnos, tecnicos }: EscalaClientProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [dataAtual, setDataAtual] = useState(new Date());
  const [vista, setVista] = useState<VistaEscala>("mes");
  const [semanaAtual, setSemanaAtual] = useState(0);
  const [filtroTecnico, setFiltroTecnico] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportando, setExportando] = useState<string | null>(null);

  const ano = dataAtual.getFullYear();
  const mes = dataAtual.getMonth();

  const mesAnterior = useCallback(() => {
    setDataAtual(new Date(ano, mes - 1, 1));
    setSemanaAtual(0);
  }, [ano, mes]);

  const mesSeguinte = useCallback(() => {
    setDataAtual(new Date(ano, mes + 1, 1));
    setSemanaAtual(0);
  }, [ano, mes]);

  const hojeStr = useMemo(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  }, []);

  // Filtrar turnos
  const turnosFiltrados = useMemo(() => {
    let result = [...turnos];
    if (filtroTecnico) {
      result = result.filter((t) => t.tecnico?.nome === filtroTecnico);
    }
    if (filtroEstado) {
      result = result.filter((t) => t.estado === filtroEstado);
    }
    return result;
  }, [turnos, filtroTecnico, filtroEstado]);

  // Agrupar por dia
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

  // Gerar dias do mês
  const diasMes = useMemo(() => {
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDia.getDate();
    const diaSemanaInicio = primeiroDia.getDay();
    const dias: Array<{ dia: number; dataStr: string; diaSemana: number; isHoje: boolean; isFimSemana: boolean }> = [];

    // Dias em branco no início
    for (let i = 0; i < diaSemanaInicio; i++) {
      dias.push({ dia: 0, dataStr: "", diaSemana: i, isHoje: false, isFimSemana: i === 0 || i === 6 });
    }

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataStr = `${ano}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
      const date = new Date(ano, mes, dia);
      const diaSemana = date.getDay();
      dias.push({
        dia,
        dataStr,
        diaSemana,
        isHoje: dataStr === hojeStr,
        isFimSemana: diaSemana === 0 || diaSemana === 6,
      });
    }

    return dias;
  }, [ano, mes, hojeStr]);

  // Separar em semanas
  const semanas = useMemo(() => {
    const result: Array<Array<(typeof diasMes)[0]>> = [];
    for (let i = 0; i < diasMes.length; i += 7) {
      result.push(diasMes.slice(i, i + 7));
    }
    return result;
  }, [diasMes]);

  const semanaSel = semanaAtual < semanas.length ? semanas[semanaAtual] : [];

  // Técnicos para a grid
  const tecnicosAtivos = useMemo(() => {
    if (filtroTecnico) {
      return tecnicos.filter((t) => t.nome === filtroTecnico);
    }
    return tecnicos;
  }, [tecnicos, filtroTecnico]);

  function obterTurno(tecnicoId: number, dataStr: string): TurnoData | undefined {
    const turnosDia = turnosPorDia[dataStr];
    if (!turnosDia) return undefined;
    return turnosDia.find((t) => t.tecnicoId === tecnicoId);
  }

  // ── Export ──
  async function handleExport(formato: string) {
    setExportando(formato);
    try {
      const filtros = {
        mes: String(mes + 1),
        ano: String(ano),
        tecnico: filtroTecnico || undefined,
        estado: filtroEstado || undefined,
      };
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
      console.error("Erro ao exportar", error);
      toast.error("Erro ao exportar escala");
    } finally {
      setExportando(null);
    }
  }

  function handlePrint() {
    window.print();
  }

  // ── Vista Mês: calendário em grelha (7 colunas × semanas) ──
  function renderGridMes() {
    // Agrupar dias do mês em semanas de 7
    const semanasArr: Array<Array<(typeof diasMes)[0]>> = [];
    for (let i = 0; i < diasMes.length; i += 7) {
      semanasArr.push(diasMes.slice(i, i + 7));
    }
// Completar a última semana com células vazias
    while (semanasArr.length > 0 && semanasArr[semanasArr.length - 1].length < 7) {
      semanasArr[semanasArr.length - 1].push({
        dia: 0,
        dataStr: "",
        diaSemana: semanasArr[semanasArr.length - 1].length,
        isHoje: false,
        isFimSemana: false,
      });
    }

    return (
      <div className="w-full overflow-x-auto" ref={printRef}>
        <div className="w-full">
          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 border-b-2 border-border">
            {diasSemanaCurto.map((dia, i) => (
              <div
                key={dia}
                className={cn(
                  "py-1 sm:py-2 text-center text-[9px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground border-r last:border-r-0 truncate",
                  (i === 0 || i === 6) && "bg-muted/20"
                )}
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Semanas */}
          {semanasArr.map((semana, si) => (
            <div key={si} className="grid grid-cols-7 border-b last:border-b-0">
              {semana.map((d) => {
                if (!d.dataStr) {
                  return (
                    <div
                      key={`empty-${si}-${d.diaSemana}`}
                      className={cn(
                        "min-h-[40px] sm:min-h-[70px] border-r last:border-r-0 p-0.5",
                        d.isFimSemana && "bg-muted/10"
                      )}
                    />
                  );
                }
                const turnosDia = turnosPorDia[d.dataStr] || [];
                return (
                  <div
                    key={d.dataStr}
                    className={cn(
                      "min-h-[40px] sm:min-h-[70px] border-r last:border-r-0 p-0.5 space-y-0.5",
                      d.isFimSemana && "bg-muted/10",
                      d.isHoje && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center justify-center">
                      <span
                        className={cn(
                          "inline-flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full text-[8px] sm:text-[11px] font-bold",
                          d.isHoje && "bg-primary text-primary-foreground"
                        )}
                      >
                        {d.dia}
                      </span>
                    </div>

                    {turnosDia.length > 0 && (
                      <div className="text-center text-[6px] sm:text-[8px] font-medium text-muted-foreground truncate">
                        {turnosDia.length}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

// ── Vista Semana: matriz técnica × dias (7 dias) ──
  function renderGridSemana() {
    const diasParaMostrar = semanaSel;
    return (
      <div className="overflow-x-auto overflow-y-auto scrollbar-thin" ref={printRef}>
        <div className="min-w-[360px] sm:min-w-[600px] md:min-w-[800px]">
          {/* Header - Dias */}
          <div
            className="grid"
            style={{ gridTemplateColumns: `minmax(100px, 1fr) repeat(${diasParaMostrar.length}, minmax(55px, 1fr))` }}
          >
            <div className="sticky left-0 z-10 bg-card border-b-2 border-r-2 border-border p-2 sm:p-3 font-semibold text-xs sm:text-sm flex items-end">
              <span className="text-muted-foreground">Técnico</span>
            </div>
            {diasParaMostrar.map((d) => (
              <div
                key={d.dataStr || `empty-${d.diaSemana}`}
                className={cn(
                  "border-b-2 border-l p-1 sm:p-2 text-center",
                  d.isFimSemana && "bg-muted/20",
                  d.isHoje && "bg-primary/5 border-primary"
                )}
              >
                <div className="text-[8px] sm:text-[10px] text-muted-foreground font-medium">
                  {diasSemanaCurto[d.diaSemana]}
                </div>
                <div className={cn(
                  "text-sm sm:text-base font-bold mt-0.5",
                  d.isHoje && "text-primary",
                  !d.dia && "text-muted-foreground/30"
                )}>
                  {d.dia || "-"}
                </div>
              </div>
            ))}
          </div>

          {/* Linhas dos técnicos */}
          {tecnicosAtivos.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <p className="text-sm">Nenhum técnico ativo encontrado</p>
            </div>
          ) : (
            tecnicosAtivos.map((tec) => (
              <div
                key={tec.id}
                className="grid"
                style={{ gridTemplateColumns: `minmax(100px, 1fr) repeat(${diasParaMostrar.length}, minmax(55px, 1fr))` }}
              >
                {/* Nome do técnico (fixo à esquerda) */}
                <div className="sticky left-0 z-10 bg-card border-r border-b p-2 sm:p-3 flex flex-col justify-center min-h-[60px] sm:min-h-[80px]">
                  <span className="font-medium text-xs sm:text-sm leading-tight">{tec.nome}</span>
                  {tec.especialidade && (
                    <span className="text-[8px] sm:text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{tec.especialidade}</span>
                  )}
                </div>

                {/* Células de turnos */}
                {diasParaMostrar.map((d) => {
                  if (!d.dataStr) {
                    return (
                      <div
                        key={`${tec.id}-empty-${d.diaSemana}`}
                        className={cn("border-b border-l min-h-[60px] sm:min-h-[80px]", d.isFimSemana && "bg-muted/10")}
                      />
                    );
                  }
                  const turno = obterTurno(tec.id, d.dataStr);
                  if (!turno) {
                    return (
                      <div
                        key={`${tec.id}-${d.dataStr}`}
                        className={cn("border-b border-l min-h-[60px] sm:min-h-[80px]", d.isFimSemana && "bg-muted/10")}
                      >
                        <div className="h-full flex items-center justify-center opacity-30">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                      </div>
                    );
                  }
                  const TipoIcon = TIPO_ICONS[turno.tipo] || Clock;
                  return (
                    <div
                      key={turno.id}
                      className={cn(
                        "border-b border-l min-h-[60px] sm:min-h-[80px] p-0.5 sm:p-1 transition-colors hover:bg-accent/20",
                        d.isFimSemana && "bg-muted/10"
                      )}
                    >
                      <div className={cn(
                        "rounded-md border px-0.5 sm:px-1.5 py-0.5 sm:py-1.5 text-[8px] sm:text-xs font-medium h-full flex flex-col justify-center",
                        TIPO_CORES_BG[turno.tipo] || "bg-muted text-muted-foreground border-muted"
                      )}>
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <TipoIcon className="h-2 w-2 sm:h-3 sm:w-3 shrink-0" />
                          <span className="font-semibold truncate text-[8px] sm:text-xs">{turno.horaInicio}-{turno.horaFim}</span>
                        </div>
                        <span className={cn(
                          "mt-0.5 sm:mt-1 inline-block rounded px-0.5 sm:px-1 py-0.5 text-[6px] sm:text-[9px] font-medium truncate",
                          {
                            "bg-blue-100 text-blue-700": turno.estado === "Agendado",
                            "bg-yellow-100 text-yellow-700": turno.estado === "Em curso",
                            "bg-green-100 text-green-700": turno.estado === "Concluído",
                            "bg-red-100 text-red-700": turno.estado === "Cancelado",
                          }
                        )}>
                          {turno.estado}
                        </span>
                        {turno.observacao && (
                          <span className="text-[6px] sm:text-[8px] text-muted-foreground mt-0.5 truncate block hidden sm:block">
                            {turno.observacao}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    );
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
          <h1 className="text-2xl font-bold">Escala de Turnos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {meses[mes]} {ano} · {turnosFiltrados.length} turno(s) · {tecnicosAtivos.length} técnico(s)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle Mês/Semana */}
          <div className="flex rounded-lg border bg-background overflow-hidden">
            <button
              onClick={() => setVista("mes")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                vista === "mes" && "bg-primary text-primary-foreground"
              )}
            >
              Mês
            </button>
            <button
              onClick={() => setVista("semana")}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                vista === "semana" && "bg-primary text-primary-foreground"
              )}
            >
              Semana
            </button>
          </div>

          {/* Imprimir */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Printer className="h-4 w-4" />
            Imprimir
          </button>

          {/* Exportar */}
          <button
            onClick={() => setExportModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border bg-background px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
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
          <option value="Agendado">Agendado</option>
          <option value="Em curso">Em curso</option>
          <option value="Concluído">Concluído</option>
          <option value="Cancelado">Cancelado</option>
        </select>
        {(filtroTecnico || filtroEstado) && (
          <button
            onClick={() => { setFiltroTecnico(""); setFiltroEstado(""); }}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Navegação Mês */}
      <div className="flex items-center justify-between">
        <button
          onClick={mesAnterior}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-lg font-semibold">{meses[mes]} {ano}</h2>
        <button
          onClick={() => {
            const hoje = new Date();
            setDataAtual(hoje);
            setSemanaAtual(0);
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
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

      {/* Seletor de Semanas (apenas na vista Semana) */}
      {vista === "semana" && semanas.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {semanas.map((_, i) => (
            <button
              key={i}
              onClick={() => setSemanaAtual(i)}
              className={cn(
                "rounded-lg px-4 py-2 text-xs font-medium transition-all border",
                semanaAtual === i
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-accent text-muted-foreground border-border"
              )}
            >
              Semana {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Grid da Escala */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {vista === "mes" ? renderGridMes() : renderGridSemana()}
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground print:hidden">
        <span>Legenda:</span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-amber-100 border border-amber-300" /> Manhã
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-orange-100 border border-orange-300" /> Tarde
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-indigo-100 border border-indigo-300" /> Noite
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-blue-100 border border-blue-300" /> Normal
        </span>
        <span className="mx-2 text-muted-foreground/30">|</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" /> Agendado
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-yellow-500" /> Em curso
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Concluído
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Cancelado
        </span>
      </div>

      {/* Modal Export */}
      <Modal
        open={exportModalOpen}
        onClose={() => { setExportModalOpen(false); setExportando(null); }}
        title="Exportar Escala de Turnos"
        size="md"
      >
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Escolha o formato para exportar a escala de turnos de <strong>{meses[mes]} {ano}</strong>
            {turnosFiltrados.length < turnos.length && (
              <span className="block mt-1 text-xs">(exportando {turnosFiltrados.length} turno(s) filtrados)</span>
            )}
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <button
              onClick={() => handleExport("pdf")}
              disabled={exportando !== null}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all hover:shadow-md disabled:opacity-50",
                "bg-red-50 border-red-200 hover:bg-red-100",
                exportando === "pdf" && "ring-2 ring-red-500"
              )}
            >
              {exportando === "pdf" ? (
                <Loader2 className="h-10 w-10 animate-spin text-red-600" />
              ) : (
                <FileText className="h-10 w-10 text-red-600" />
              )}
              <p className="font-semibold text-sm">PDF</p>
              <p className="text-[10px] text-muted-foreground">Documento profissional</p>
            </button>
            <button
              onClick={() => handleExport("excel")}
              disabled={exportando !== null}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all hover:shadow-md disabled:opacity-50",
                "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
                exportando === "excel" && "ring-2 ring-emerald-500"
              )}
            >
              {exportando === "excel" ? (
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="h-10 w-10 text-emerald-600" />
              )}
              <p className="font-semibold text-sm">Excel</p>
              <p className="text-[10px] text-muted-foreground">Planilha com abas</p>
            </button>
            <button
              onClick={() => handleExport("word")}
              disabled={exportando !== null}
              className={cn(
                "flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all hover:shadow-md disabled:opacity-50",
                "bg-blue-50 border-blue-200 hover:bg-blue-100",
                exportando === "word" && "ring-2 ring-blue-500"
              )}
            >
              {exportando === "word" ? (
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              ) : (
                <FileDown className="h-10 w-10 text-blue-600" />
              )}
              <p className="font-semibold text-sm">Word</p>
              <p className="text-[10px] text-muted-foreground">Documento editável</p>
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
