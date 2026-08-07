"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  GitCompareArrows,
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Loader2,
  AlertOctagon,
} from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import { criarComparacao } from "@/server/actions/cognitivo-actions";
import type { ComparacaoExame } from "@/features/cognitivo/types";
import { formatDate } from "@/utils/format";

interface ResultadoComparacao {
  novasLesoes?: string[];
  progressao?: string[];
  regressao?: string[];
  estabilidade?: string[];
}

interface Props {
  comparacoes: ComparacaoExame[];
  exames: { id: number; codigo: string | null; dataExame: string; estado: string; paciente?: { nome: string }; tipoExame?: { nome: string } }[];
}

export function EvolucaoClient({ comparacoes, exames }: Props) {
  const [exameBase, setExameBase] = useState<number | "">("");
  const [exameComparar, setExameComparar] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [comparacoesLista, setComparacoesLista] = useState<ComparacaoExame[]>(comparacoes);
  const [erro, setErro] = useState<string | null>(null);

  async function criarNovaComparacao() {
    if (!exameBase || !exameComparar) {
      setErro("Selecione os dois exames (base e comparar).");
      return;
    }
    if (exameBase === exameComparar) {
      setErro("Os exames base e comparado devem ser diferentes.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const nova = await criarComparacao({ exameBaseId: Number(exameBase), exameComparadoId: Number(exameComparar) });
      setComparacoesLista((prev) => [nova, ...prev]);
      setExameBase("");
      setExameComparar("");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao criar comparação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <GitCompareArrows className="h-6 w-6 text-primary" />
          Evolução Radiológica & Detector de Mudanças
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare exames antigos com novos e destaque automaticamente novas lesões, crescimento, redução e alterações estruturais.
        </p>
      </div>

      {/* Criar comparação */}
      <CognitivoCard title="Criar Nova Comparação" subtitle="Selecione o exame base e o exame a comparar">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <select
            value={exameBase}
            onChange={(e) => setExameBase(e.target.value ? Number(e.target.value) : "")}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Exame base (antigo)</option>
            {exames.map((e) => <option key={e.id} value={e.id}>{e.tipoExame?.nome} · {e.codigo} · {formatDate(e.dataExame)}</option>)}
          </select>
          <select
            value={exameComparar}
            onChange={(e) => setExameComparar(e.target.value ? Number(e.target.value) : "")}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Exame a comparar (novo)</option>
            {exames.map((e) => <option key={e.id} value={e.id}>{e.tipoExame?.nome} · {e.codigo} · {formatDate(e.dataExame)}</option>)}
          </select>
          <button
            onClick={criarNovaComparacao}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Comparar
          </button>
        </div>
        {erro && <p className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertOctagon className="h-4 w-4" /> {erro}</p>}
      </CognitivoCard>

      {/* Resultados */}
      {comparacoesLista.length === 0 ? (
        <CognitivoCard>
          <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <Sparkles className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhuma comparação ainda</p>
            <p className="text-xs mt-1">Crie uma comparação para ver o detector de mudanças em ação.</p>
          </div>
        </CognitivoCard>
      ) : (
        comparacoesLista.map((c) => {
const res = (c.resultadoJson ?? {}) as ResultadoComparacao;
          return (
            <CognitivoCard key={c.id} title={`Comparação #${c.id}`} subtitle={`${c.exameBase?.tipoExame?.nome || "Exame"} vs ${c.exameVar?.tipoExame?.nome || "Exame"}`}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Exame base</p>
                  <p className="font-medium">{c.exameBase?.codigo}</p>
                  <p className="text-xs">{c.exameBase ? formatDate(c.exameBase.dataExame) : ""}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Exame comparado</p>
                  <p className="font-medium">{c.exameVar?.codigo}</p>
                  <p className="text-xs">{c.exameVar ? formatDate(c.exameVar.dataExame) : ""}</p>
                </div>
              </div>

              {/* Indicadores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                  <div className="flex items-center gap-2 text-red-600"><AlertOctagon className="h-4 w-4" /><span className="text-xs font-medium">Novas Lesões</span></div>
                  <p className="text-2xl font-bold mt-1">{c.novasLesoes}</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                  <div className="flex items-center gap-2 text-amber-600"><TrendingUp className="h-4 w-4" /><span className="text-xs font-medium">Progressão</span></div>
                  <p className="text-2xl font-bold mt-1">{c.progressao}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
                  <div className="flex items-center gap-2 text-emerald-600"><TrendingDown className="h-4 w-4" /><span className="text-xs font-medium">Regressão</span></div>
                  <p className="text-2xl font-bold mt-1">{c.regressao}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center gap-2 text-slate-600"><Minus className="h-4 w-4" /><span className="text-xs font-medium">Estável</span></div>
                  <p className="text-2xl font-bold mt-1">{c.estabilidade}</p>
                </div>
              </div>

              {/* Conclusão */}
              {c.conclusao && (
                <div className="mt-4 rounded-lg bg-muted/40 p-4 text-sm">
                  <span className="font-semibold">Conclusão: </span>
                  {c.conclusao}
                </div>
              )}

              {/* Detalhes das alterações */}
{(res.novasLesoes?.length || res.progressao?.length || res.regressao?.length) ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {res.novasLesoes && res.novasLesoes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-1">Novas lesões destacadas</p>
                      <ul className="space-y-1 text-xs">
                        {res.novasLesoes.map((l, i) => <li key={i} className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-red-500" /> {l}</li>)}
                      </ul>
                    </div>
                  )}
                  {res.progressao && res.progressao.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-1">Crescimento detetado</p>
                      <ul className="space-y-1 text-xs">
                        {res.progressao.map((l, i) => <li key={i} className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-amber-500" /> {l}</li>)}
                      </ul>
                    </div>
                  )}
                  {res.regressao && res.regressao.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 mb-1">Redução detetada</p>
                      <ul className="space-y-1 text-xs">
                        {res.regressao.map((l, i) => <li key={i} className="flex items-center gap-1"><TrendingDown className="h-3 w-3 text-emerald-500" /> {l}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}
            </CognitivoCard>
          );
        })
      )}
    </motion.div>
  );
}
