"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  AlertOctagon,
  Loader2,
  Plus,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Filter,
} from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import {
  detetarContradicoes,
  listarContradicoes,
  resolverContradicao,
} from "@/server/actions/cognitivo-actions";
import type { Contradicao } from "@/features/cognitivo/types";
import { formatDate } from "@/utils/format";

interface ExameAux {
  id: number;
  codigo: string | null;
  dataExame: string;
  estado: string;
  paciente?: { nome: string };
  tipoExame?: { nome: string };
}

interface Props {
  contradicoes: Contradicao[];
  exames: ExameAux[];
}

const severidadeCor: Record<string, string> = {
  alta: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  critica: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  media: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
  baixa: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
};

const estadoBadge: Record<string, { label: string; cls: string }> = {
  aberta: { label: "Aberta", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  confirmada: { label: "Confirmada", cls: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300" },
  descartada: { label: "Descartada", cls: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300" },
  resolvida: { label: "Resolvida", cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
};

export function ContradicoesClient({ contradicoes: initial, exames }: Props) {
  const [lista, setLista] = useState<Contradicao[]>(initial);
  const [exameId, setExameId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroEstado, setFiltroEstado] = useState("");

  async function detetar() {
    if (!exameId) {
      setErro("Selecione um exame para detetar contradições.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const novas = await detetarContradicoes(Number(exameId)) as Contradicao[];
      setLista((prev) => [...novas, ...prev]);
      setExameId("");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao detetar contradições.");
    } finally {
      setLoading(false);
    }
  }

  async function resolver(id: number, estado: "confirmada" | "descartada" | "resolvida") {
    try {
      const atualizada = await resolverContradicao(id, estado);
      setLista((prev) => prev.map((c) => (c.id === id ? atualizada : c)));
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao resolver contradição.");
    }
  }

  async function recarregar() {
    setLoading(true);
    try {
      const data = await listarContradicoes(filtroEstado || undefined);
      setLista(data);
      setErro(null);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao recarregar.");
    } finally {
      setLoading(false);
    }
  }

  const filtradas = filtroEstado ? lista.filter((c) => c.estado === filtroEstado) : lista;
  const pendentes = lista.filter((c) => c.estado === "aberta" || c.estado === "confirmada").length;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertOctagon className="h-6 w-6 text-primary" />
            Detector de Contradições
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Detete inconsistências entre imagem, laudo e histórico e classifique cada caso.
          </p>
        </div>
        <button
          onClick={recarregar}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
        >
          <Loader2 className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Resumo */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total de contradições</p>
          <p className="text-2xl font-bold mt-1">{lista.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{pendentes}</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground">Resolvidas</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{lista.filter((c) => c.estado === "resolvida").length}</p>
        </div>
      </div>

      {/* Detetar nova */}
      <CognitivoCard title="Detetar Contradições" subtitle="Selecione um exame para analisar imagem, laudo e histórico">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <select
            value={exameId}
            onChange={(e) => setExameId(e.target.value ? Number(e.target.value) : "")}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecione um exame...</option>
            {exames.map((e) => (
              <option key={e.id} value={e.id}>{e.tipoExame?.nome || "Exame"} · {e.codigo || `#${e.id}`} · {e.paciente?.nome || ""}</option>
            ))}
          </select>
          <button
            onClick={detetar}
            disabled={loading || !exameId}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Detetar
          </button>
        </div>
        {erro && <p className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertOctagon className="h-4 w-4" /> {erro}</p>}
      </CognitivoCard>

      {/* Filtro */}
      <CognitivoCard title="Lista de Contradições" subtitle="Filtre e classifique cada inconsistência">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Filter className="h-4 w-4" />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os estados</option>
            <option value="aberta">Aberta</option>
            <option value="confirmada">Confirmada</option>
            <option value="descartada">Descartada</option>
            <option value="resolvida">Resolvida</option>
          </select>
        </div>

        {filtradas.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <ShieldCheck className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhuma contradição encontrada</p>
            <p className="text-xs mt-1">Execute uma deteção para analisar inconsistências.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtradas.map((c) => (
              <div key={c.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${severidadeCor[c.severidade] || severidadeCor.media}`}>
                      {c.severidade.toUpperCase()}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${estadoBadge[c.estado]?.cls || estadoBadge.aberta.cls}`}>
                      {estadoBadge[c.estado]?.label || c.estado}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm">{c.descricao}</p>
                {c.exame && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Exame: {c.exame.tipoExame?.nome || "—"} · {c.exame.codigo || `#${c.exame.id}`} · {c.exame.paciente?.nome || ""}
                  </p>
                )}
                {c.estado !== "resolvida" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => resolver(c.id, "confirmada")}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Confirmar
                    </button>
                    <button
                      onClick={() => resolver(c.id, "descartada")}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Descartar
                    </button>
                    <button
                      onClick={() => resolver(c.id, "resolvida")}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Resolver
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CognitivoCard>
    </motion.div>
  );
}

export default ContradicoesClient;
