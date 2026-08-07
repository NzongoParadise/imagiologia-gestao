"use client";

import { useState, useMemo } from "react";
import { formatDateTime, formatRelative } from "@/utils/format";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { Pagination } from "@/components/ui/pagination";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Activity,
  UserPlus,
  RefreshCw,
  History,
  Users,
  FileText,
  Database,
  ShieldCheck,
  CalendarDays,
  Building2,
} from "lucide-react";

interface HistoricoItem {
  id: number;
  acao: string;
  entidade: string;
  descricao: string | null;
  createdAt: string;
  utilizador: { id: number; nome: string; email?: string } | null;
  paciente: { id: number; nome: string } | null;
  exame: { id: number } | null;
}

interface AcaoCount {
  acao: string;
  _count: { _all: number };
}

interface EntidadeCount {
  entidade: string;
  _count: { _all: number };
}

interface HistoricoClientProps {
  historico: HistoricoItem[];
  total: number;
  porAcao: AcaoCount[];
  porEntidade: EntidadeCount[];
  utilizadoresAtivos: number;
}

const acaoIcons: Record<string, React.ElementType> = {
  CRIACAO: Plus,
  ATUALIZACAO: Edit3,
  ELIMINACAO: Trash2,
  ESTADO: RefreshCw,
  LOGIN: UserPlus,
  UPLOAD: FileText,
  REMOCAO: Trash2,
};

const acaoColors: Record<string, string> = {
  CRIACAO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ATUALIZACAO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  ELIMINACAO: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ESTADO: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  LOGIN: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  UPLOAD: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  REMOCAO: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const acaoLabels: Record<string, string> = {
  CRIACAO: "Criação",
  ATUALIZACAO: "Atualização",
  ELIMINACAO: "Eliminação",
  ESTADO: "Mudança de Estado",
  LOGIN: "Login",
  UPLOAD: "Upload",
  REMOCAO: "Remoção",
};

export function HistoricoClient({
  historico,
  total,
  porAcao,
  porEntidade,
  utilizadoresAtivos,
}: HistoricoClientProps) {
  const [search, setSearch] = useState("");
  const [entidadeFilter, setEntidadeFilter] = useState("");
  const [acaoFilter, setAcaoFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const filtered = useMemo(() => {
    return historico.filter((item) => {
      if (search && !item.descricao?.toLowerCase().includes(search.toLowerCase())) return false;
      if (entidadeFilter && item.entidade !== entidadeFilter) return false;
      if (acaoFilter && item.acao !== acaoFilter) return false;
      return true;
    });
  }, [historico, search, entidadeFilter, acaoFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginaSegura = Math.min(currentPage, totalPages);
  const paginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * pageSize;
    return filtered.slice(inicio, inicio + pageSize);
  }, [filtered, paginaSegura, pageSize]);

  const entidades = [...new Set(historico.map((h) => h.entidade))];
  const acoes = [...new Set(historico.map((h) => h.acao))];

  // Agrupar por data (apenas os itens da página atual)
  const grouped = useMemo(() => {
    const groups: Record<string, HistoricoItem[]> = {};
    paginadas.forEach((item) => {
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
  }, [paginadas]);

  const totalAcoes = porAcao.reduce((acc, a) => acc + a._count._all, 0);
  const totalEntidades = porEntidade.length;

  const stats = [
    {
      label: "Total de Registo",
      value: total.toLocaleString("pt-PT"),
      icon: Database,
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    {
      label: "Ações Registadas",
      value: totalAcoes.toLocaleString("pt-PT"),
      icon: Activity,
      color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    },
    {
      label: "Entidades Monitorizadas",
      value: totalEntidades.toLocaleString("pt-PT"),
      icon: ShieldCheck,
      color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
    {
      label: "Utilizadores Ativos",
      value: utilizadoresAtivos.toLocaleString("pt-PT"),
      icon: Users,
      color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold">Histórico do Sistema</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registo completo de todas as atividades do sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-xl border bg-card p-4 flex items-center gap-4"
            >
              <div className={cn("rounded-lg p-2.5 shrink-0", stat.color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{stat.label}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar no histórico..."
value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <select
value={entidadeFilter}
          onChange={(e) => { setEntidadeFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="">Todas as entidades</option>
          {entidades.map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
        <select
value={acaoFilter}
          onChange={(e) => { setAcaoFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        >
          <option value="">Todas as ações</option>
          {acoes.map((a) => (
            <option key={a} value={a}>{acaoLabels[a] || a}</option>
          ))}
        </select>
      </div>

      {/* Ações por tipo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {porAcao.map((a) => {
          const Icon = acaoIcons[a.acao] || Activity;
          const colorClass = acaoColors[a.acao] || "bg-muted text-muted-foreground";
          const pct = totalAcoes > 0 ? Math.round((a._count._all / totalAcoes) * 100) : 0;
          return (
            <div key={a.acao} className="rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("rounded-md p-1.5", colorClass)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium truncate">{acaoLabels[a.acao] || a.acao}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">{a._count._all}</span>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full", colorClass.split(" ")[0])}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Entidades monitorizadas */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Entidades Monitorizadas</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {porEntidade.map((e) => (
            <button
              key={e.entidade}
              onClick={() => setEntidadeFilter(entidadeFilter === e.entidade ? "" : e.entidade)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                entidadeFilter === e.entidade
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-background hover:bg-muted/50"
              )}
            >
              <span className="capitalize">{e.entidade}</span>
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                {e._count._all}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([date, items]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-4">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground">{date}</h2>
              <span className="text-xs text-muted-foreground">({items.length} registos)</span>
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
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {item.entidade}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs font-medium text-primary">
                          {acaoLabels[item.acao] || item.acao}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </span>
                        <span className="text-xs text-muted-foreground italic">
                          ({formatRelative(item.createdAt)})
                        </span>
                      </div>
                      <p className="text-sm">{item.descricao || "N/A"}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {item.utilizador && (
                          <span className="text-xs text-muted-foreground">
                            Por: <span className="font-medium text-foreground">{item.utilizador.nome}</span>
                          </span>
                        )}
                        {item.paciente && (
                          <span className="text-xs text-muted-foreground">
                            Paciente: <span className="font-medium text-foreground">{item.paciente.nome}</span>
                          </span>
                        )}
                        {item.exame && (
                          <span className="text-xs text-muted-foreground">
                            Exame #{item.exame.id}
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
            <History className="h-12 w-12 mb-3" />
            <p className="text-sm">Nenhum registo encontrado</p>
          </div>
        )}

        <Pagination
          currentPage={paginaSegura}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </motion.div>
  );
}
