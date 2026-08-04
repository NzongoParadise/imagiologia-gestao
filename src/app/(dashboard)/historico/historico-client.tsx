"use client";

import { useState, useMemo } from "react";
import { formatDateTime } from "@/utils/format";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Clock,
  Activity,
  UserPlus,
  RefreshCw,
} from "lucide-react";

interface HistoricoItem {
  id: number;
  acao: string;
  entidade: string;
  descricao: string | null;
  createdAt: string;
  utilizador: { id: number; nome: string } | null;
  paciente: { id: number; nome: string } | null;
  exame: { id: number } | null;
}

interface HistoricoClientProps {
  historico: HistoricoItem[];
}

const acaoIcons: Record<string, React.ElementType> = {
  CRIACAO: Plus,
  ATUALIZACAO: Edit3,
  ELIMINACAO: Trash2,
  ESTADO: RefreshCw,
  LOGIN: UserPlus,
};

const acaoColors: Record<string, string> = {
  CRIACAO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ATUALIZACAO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ELIMINACAO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ESTADO: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  LOGIN: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
};

export function HistoricoClient({ historico }: HistoricoClientProps) {
  const [search, setSearch] = useState("");
  const [entidadeFilter, setEntidadeFilter] = useState("");

  const filtered = useMemo(() => {
    return historico.filter((item) => {
      if (search && !item.descricao?.toLowerCase().includes(search.toLowerCase())) return false;
      if (entidadeFilter && item.entidade !== entidadeFilter) return false;
      return true;
    });
  }, [historico, search, entidadeFilter]);

  const entidades = [...new Set(historico.map((h) => h.entidade))];

  // Agrupar por data
  const grouped = useMemo(() => {
    const groups: Record<string, HistoricoItem[]> = {};
    filtered.forEach((item) => {
      const date = new Date(item.createdAt);
      const key = date.toLocaleDateString("pt-PT", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filtered]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Histórico</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registo de todas as atividades do sistema
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar no histórico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <select
          value={entidadeFilter}
          onChange={(e) => setEntidadeFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="">Todas as entidades</option>
          {entidades.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground">{date}</h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2 ml-7">
              {items.map((item, idx) => {
                const Icon = acaoIcons[item.acao] || Activity;
                const colorClass = acaoColors[item.acao] || "bg-muted text-muted-foreground";
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="relative flex items-start gap-4 rounded-lg border bg-card p-4 hover:bg-muted/30 transition-colors"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[1.85rem] top-5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />

                    <div className={cn("rounded-lg p-2 shrink-0", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {item.entidade}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm">{item.descricao || "N/A"}</p>
                      <div className="flex items-center gap-3 mt-1">
                        {item.utilizador && (
                          <span className="text-xs text-muted-foreground">
                            Por: {item.utilizador.nome}
                          </span>
                        )}
                        {item.paciente && (
                          <span className="text-xs text-muted-foreground">
                            Paciente: {item.paciente.nome}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Activity className="h-12 w-12 mb-3" />
            <p className="text-sm">Nenhum registo encontrado</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

