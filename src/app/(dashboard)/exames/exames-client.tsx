"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, Search, Filter } from "lucide-react";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { ESTADOS_EXAME } from "@/types";
import { motion } from "framer-motion";
import { usePermissoes } from "@/hooks/use-permissoes";

interface Exame {
  id: number;
  codigo: string | null;
  estado: string;
  dataExame: string;
  medicoSolicitante: string | null;
  paciente: { id: number; nome: string };
  tipoExame: { id: number; nome: string; modalidade: string | null };
  tecnico: { id: number; nome: string } | null;
  procedencia: { id: number; nome: string } | null;
  _count: { imagens: number };
}

interface ExamesClientProps {
  initialData: {
    data: Exame[];
    total: number;
    pages: number;
    currentPage: number;
  };
}

const statusColors: Record<string, string> = {
  Pendente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Em andamento": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Realizado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Entregue: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function ExamesClient({ initialData }: ExamesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pode } = usePermissoes();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [estadoFilter, setEstadoFilter] = useState(searchParams.get("estado") || "");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("search", value);
      else params.delete("search");
      params.set("page", "1");
      router.push(`/exames?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleFilterEstado = useCallback(
    (estado: string) => {
      setEstadoFilter(estado);
      const params = new URLSearchParams(searchParams.toString());
      if (estado) params.set("estado", estado);
      else params.delete("estado");
      params.set("page", "1");
      router.push(`/exames?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Exames</h1>
          <p className="text-sm text-muted-foreground">
            {initialData.total} exame(s) registado(s)
          </p>
        </div>
        {pode("exames", "criar") && (
          <Link
            href="/exames/novo"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Exame
          </Link>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar por paciente, código..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
            estadoFilter ? "border-primary bg-primary/5 text-primary" : "hover:bg-accent"
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      {/* Estado filters */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          <button
            onClick={() => handleFilterEstado("")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              !estadoFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            Todos
          </button>
          {ESTADOS_EXAME.map((estado) => (
            <button
              key={estado.value}
              onClick={() => handleFilterEstado(estado.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                estadoFilter === estado.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {estado.label}
            </button>
          ))}
        </motion.div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3.5 text-left font-medium">Paciente</th>
                <th className="px-4 py-3.5 text-left font-medium">Exame</th>
                <th className="px-4 py-3.5 text-left font-medium">Técnico</th>
                <th className="px-4 py-3.5 text-left font-medium">Data</th>
                <th className="px-4 py-3.5 text-center font-medium">Estado</th>
                <th className="px-4 py-3.5 text-center font-medium">Imagens</th>
                <th className="px-4 py-3.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialData.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum exame encontrado
                  </td>
                </tr>
              ) : (
                initialData.data.map((exame) => (
                  <tr key={exame.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/pacientes/${exame.paciente.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {exame.paciente.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{exame.tipoExame.nome}</p>
                        {exame.tipoExame.modalidade && (
                          <p className="text-xs text-muted-foreground">{exame.tipoExame.modalidade}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {exame.tecnico?.nome || "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(exame.dataExame)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                        statusColors[exame.estado] || "bg-muted text-muted-foreground"
                      )}>
                        {exame.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {exame._count.imagens}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/exames/${exame.id}`}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={initialData.currentPage}
          totalPages={initialData.pages}
          total={initialData.total}
          onPageChange={(page) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("page", String(page));
            router.push(`/exames?${params.toString()}`);
          }}
        />
      </div>
    </motion.div>
  );
}
