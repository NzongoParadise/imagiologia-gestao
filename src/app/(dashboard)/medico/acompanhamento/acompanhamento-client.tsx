"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Filter, ClipboardList, FileSignature } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";
import { Pagination } from "@/components/ui/pagination";
import type { SolicitacaoLista } from "@/features/medico/types";
import {
  ESTADOS_PORTAL,
  PRIORIDADES,
  estadoColors,
  prioridadeColors,
} from "@/features/medico/constants";

interface Props {
  initialData: SolicitacaoLista;
}

export function AcompanhamentoClient({ initialData }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [estadoFilter, setEstadoFilter] = useState(searchParams.get("estado") || "");
  const [prioridadeFilter, setPrioridadeFilter] = useState(searchParams.get("prioridade") || "");
  const [showFilters, setShowFilters] = useState(false);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      params.set("page", "1");
      router.push(`/medico/acompanhamento?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6 text-primary" />
          Acompanhamento de Solicitações
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {initialData.total} solicitação(ões) registada(s)
        </p>
      </div>

      {/* Search & filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar por paciente, código, diagnóstico..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              updateParams({ search: e.target.value });
            }}
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
            (estadoFilter || prioridadeFilter) ? "border-primary bg-primary/5 text-primary" : "hover:bg-accent"
          )}
        >
          <Filter className="h-4 w-4" />
          Filtros
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Estado</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setEstadoFilter(""); updateParams({ estado: "" }); }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  !estadoFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                Todos
              </button>
              {ESTADOS_PORTAL.map((e) => (
                <button
                  key={e}
                  onClick={() => { setEstadoFilter(e); updateParams({ estado: e }); }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    estadoFilter === e ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">Prioridade</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => { setPrioridadeFilter(""); updateParams({ prioridade: "" }); }}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  !prioridadeFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                )}
              >
                Todas
              </button>
{PRIORIDADES.map((p) => (
                <button
                  key={p}
                  onClick={() => { setPrioridadeFilter(p); updateParams({ prioridade: p }); }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    prioridadeFilter === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
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
                <th className="px-4 py-3.5 text-left font-medium">Código</th>
                <th className="px-4 py-3.5 text-left font-medium">Data</th>
                <th className="px-4 py-3.5 text-center font-medium">Prioridade</th>
                <th className="px-4 py-3.5 text-center font-medium">Estado</th>
                <th className="px-4 py-3.5 text-center font-medium">Laudo</th>
                <th className="px-4 py-3.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {initialData.data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhuma solicitação encontrada
                  </td>
                </tr>
              ) : (
                initialData.data.map((exame) => (
                  <tr key={exame.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <Link
                        href={`/medico/pacientes/${exame.paciente?.id}`}
                        className="text-primary hover:underline"
                      >
                        {exame.paciente?.nome || "Paciente"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{exame.tipoExame?.nome || "Exame"}</p>
                      {exame.diagnosticoClinico && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {exame.diagnosticoClinico}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {exame.codigo || `#${exame.id}`}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(exame.dataExame)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                        prioridadeColors[exame.prioridade] || "bg-muted text-muted-foreground"
                      )}>
                        {exame.prioridade}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn(
                        "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                        estadoColors[exame.estado] || "bg-muted text-muted-foreground"
                      )}>
                        {exame.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {exame.laudos?.[0]?.assinado ? (
                        <FileSignature className="inline h-4 w-4 text-green-600" />
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/medico/exames/${exame.id}`}
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
            router.push(`/medico/acompanhamento?${params.toString()}`);
          }}
        />
      </div>
    </motion.div>
  );
}
