"use client";

import { useState, useMemo } from "react";
import { formatDate, formatBytes } from "@/utils/format";
import { motion } from "framer-motion";
import {
  Search,
  ImageIcon,
  Download,
  Calendar,
  ExternalLink,
  Brain,
  FileText,
  Filter,
  RefreshCw,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import { MLAnalise } from "@/features/imagens/components/ml-analise";
import { ModalRelatorioImagens } from "@/features/imagens/components/modal-relatorio-imagens";

interface ImagemItem {
  id: number;
  filename: string;
  originalName: string;
  tamanho: number;
  path: string;
  createdAt: string;
  exame: {
    id: number;
    paciente: { id: number; nome: string };
    tipoExame: { id: number; nome: string };
    procedencia: { id: number; nome: string } | null;
  };
}

interface FiltrosState {
  paciente: string;
  tipoExame: string;
  procedencia: string;
  dataInicio: string;
  dataFim: string;
  tamanhoMin: string;
  tamanhoMax: string;
}

export function ImagensClient({ imagens }: { imagens: ImagemItem[] }) {
  const [search, setSearch] = useState("");
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

const [filtros, setFiltros] = useState<FiltrosState>({
    paciente: "",
    tipoExame: "",
    procedencia: "",
    dataInicio: "",
    dataFim: "",
    tamanhoMin: "",
    tamanhoMax: "",
  });

  // Extrair tipos de exame e procedencias unicos para filtros
  const tiposExameUnicos = useMemo(() => {
    const tipos = new Set(imagens.map((img) => img.exame.tipoExame.nome));
    return Array.from(tipos).sort();
  }, [imagens]);

  const procedenciasUnicas = useMemo(() => {
    const procs = new Set(
      imagens.map((img) => img.exame.procedencia?.nome).filter(Boolean) as string[]
    );
    return Array.from(procs).sort();
  }, [imagens]);

  // Aplicar todos os filtros
  const filtered = useMemo(() => {
    let result = [...imagens];

    // Filtro de pesquisa textual
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((img) => {
        return (
          img.originalName.toLowerCase().includes(q) ||
          img.exame.paciente.nome.toLowerCase().includes(q) ||
          img.exame.tipoExame.nome.toLowerCase().includes(q)
        );
      });
    }

    // Filtro por paciente
    if (filtros.paciente) {
      const q = filtros.paciente.toLowerCase();
      result = result.filter((img) =>
        img.exame.paciente.nome.toLowerCase().includes(q)
      );
    }

// Filtro por tipo de exame
    if (filtros.tipoExame) {
      result = result.filter(
        (img) => img.exame.tipoExame.nome === filtros.tipoExame
      );
    }

    // Filtro por procedencia
    if (filtros.procedencia) {
      result = result.filter(
        (img) => img.exame.procedencia?.nome === filtros.procedencia
      );
    }

    // Filtro por data
    if (filtros.dataInicio) {
      const dataInicio = new Date(filtros.dataInicio).getTime();
      result = result.filter(
        (img) => new Date(img.createdAt).getTime() >= dataInicio
      );
    }
    if (filtros.dataFim) {
      const dataFim = new Date(filtros.dataFim).getTime() + 86400000; // +1 dia
      result = result.filter(
        (img) => new Date(img.createdAt).getTime() <= dataFim
      );
    }

    // Filtro por tamanho
    if (filtros.tamanhoMin) {
      const min = parseInt(filtros.tamanhoMin) * 1024; // converter KB para bytes
      if (!isNaN(min)) {
        result = result.filter((img) => img.tamanho >= min);
      }
    }
    if (filtros.tamanhoMax) {
      const max = parseInt(filtros.tamanhoMax) * 1024;
      if (!isNaN(max)) {
        result = result.filter((img) => img.tamanho <= max);
      }
    }

    return result;
}, [imagens, search, filtros]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginaSegura = Math.min(currentPage, totalPages);
  const paginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * pageSize;
    return filtered.slice(inicio, inicio + pageSize);
  }, [filtered, paginaSegura, pageSize]);

  const temFiltrosAtivos = Object.values(filtros).some((v) => v !== "");

const limparFiltros = () => {
    setFiltros({
      paciente: "",
      tipoExame: "",
      procedencia: "",
      dataInicio: "",
      dataFim: "",
      tamanhoMin: "",
      tamanhoMax: "",
    });
    setSearch("");
    setCurrentPage(1);
  };

  const atualizarFiltro = (chave: keyof FiltrosState, valor: string) => {
    setFiltros((prev) => ({ ...prev, [chave]: valor }));
    setCurrentPage(1);
  };

  if (imagens.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold">Imagens</h1>
          <p className="text-sm text-muted-foreground mt-1">
            0 imagens armazenadas
          </p>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <EmptyState
          icon={<ImageIcon className="h-8 w-8" />}
          title="Nenhuma imagem encontrada"
          description="As imagens sao associadas automaticamente aos exames"
        />
      </motion.div>
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
          <h1 className="text-2xl font-bold">Imagens</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} de {imagens.length} imagem(ns) armazenada(s)
            {temFiltrosAtivos && " (com filtros ativos)"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              mostrarFiltros || temFiltrosAtivos
                ? "border-primary bg-primary/5 text-primary"
                : "border-input text-muted-foreground hover:bg-accent"
            )}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {temFiltrosAtivos && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {Object.values(filtros).filter(Boolean).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowRelatorio(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <FileText className="h-4 w-4" />
            Relatorio IA
          </button>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
placeholder="Pesquisar por nome, paciente, tipo de exame..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* Painel de filtros avançados */}
      {mostrarFiltros && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros Avancados</span>
            </div>
            {temFiltrosAtivos && (
              <button
                onClick={limparFiltros}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
                Limpar filtros
              </button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {/* Filtro por paciente */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Paciente
              </label>
              <input
                type="text"
                placeholder="Nome do paciente..."
                value={filtros.paciente}
                onChange={(e) => atualizarFiltro("paciente", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Filtro por tipo de exame */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tipo de Exame
              </label>
              <select
                value={filtros.tipoExame}
                onChange={(e) => atualizarFiltro("tipoExame", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Todos</option>
                {tiposExameUnicos.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por procedencia */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Procedencia
              </label>
              <select
                value={filtros.procedencia}
                onChange={(e) => atualizarFiltro("procedencia", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="">Todas</option>
                {procedenciasUnicas.map((proc) => (
                  <option key={proc} value={proc}>
                    {proc}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro data inicio */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Data Inicio
              </label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => atualizarFiltro("dataInicio", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Filtro data fim */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Data Fim
              </label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => atualizarFiltro("dataFim", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Filtro tamanho min */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tamanho Min (KB)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={filtros.tamanhoMin}
                onChange={(e) => atualizarFiltro("tamanhoMin", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Filtro tamanho max */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Tamanho Max (KB)
              </label>
              <input
                type="number"
                min="0"
                placeholder="10000"
                value={filtros.tamanhoMax}
                onChange={(e) => atualizarFiltro("tamanhoMax", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Grid de imagens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filtered.map((img) => (
          <div
            key={img.id}
            className="group relative aspect-square overflow-hidden rounded-xl border bg-muted"
          >
            <img
              src={img.path}
              alt={img.originalName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <MLAnalise
                imagemId={img.id}
                imageUrl={img.path}
                imageName={img.originalName}
                tipoExame={img.exame.tipoExame.nome}
              />
            </div>
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white font-medium truncate">
                {img.exame.paciente.nome}
              </p>
              <p className="text-[9px] text-white/80 truncate">
                {img.exame.tipoExame.nome}
              </p>
            </div>
          </div>
        ))}
      </div>

{/* Tabela de imagens */}
      <div className="rounded-xl border bg-card">
        <div className="divide-y">
          {paginadas.map((img) => (
            <div
              key={img.id}
              className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                <img
                  src={img.path}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {img.originalName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {img.exame.paciente.nome} - {img.exame.tipoExame.nome}
                </p>
              </div>
              <div className="text-xs text-muted-foreground hidden sm:block">
                {formatBytes(img.tamanho)}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
                <Calendar className="h-3 w-3" /> {formatDate(img.createdAt)}
              </div>
              <div className="flex items-center gap-1">
                <MLAnalise
                  imagemId={img.id}
                  imageUrl={img.path}
                  imageName={img.originalName}
                  tipoExame={img.exame.tipoExame.nome}
                />
                <Link
                  href={"/exames/" + img.exame.id}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <a
                  href={img.path}
                  download={img.originalName}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
            </div>
))}
        </div>

        <Pagination
          currentPage={paginaSegura}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Resultados vazios com filtros */}
      {filtered.length === 0 && temFiltrosAtivos && (
        <div className="text-center py-8">
          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Nenhuma imagem corresponde aos filtros aplicados
          </p>
          <button
            onClick={limparFiltros}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}

      <ModalRelatorioImagens
        open={showRelatorio}
        onClose={() => setShowRelatorio(false)}
        imagens={filtered}
      />
    </motion.div>
  );
}
