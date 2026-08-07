"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ScanSearch,
  Plus,
  Loader2,
  AlertOctagon,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Eraser,
  Boxes,
  Filter,
} from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import { criarComparacao, listarComparacoes } from "@/server/actions/cognitivo-actions";
import type { ComparacaoExame } from "@/features/cognitivo/types";
import { formatDate } from "@/utils/format";

interface ResultadoComparacao {
  novasLesoes?: string[];
  progressao?: string[];
  regressao?: string[];
  estabilidade?: string[];
  desaparecidos?: string[];
  estruturais?: string[];
  achadosBase?: { nome: string; probabilidade?: number }[];
  achadosComp?: { nome: string; probabilidade?: number }[];
  intervaloDias?: number;
}

interface Props {
  comparacoes: ComparacaoExame[];
  pacientes: { id: number; nome: string; numeroProcesso: string }[];
  exames: { id: number; codigo: string | null; dataExame: string; estado: string; paciente?: { nome: string }; tipoExame?: { nome: string } }[];
}

export function DetectorMudancasClient({ comparacoes, pacientes, exames }: Props) {
  const [pacienteId, setPacienteId] = useState<number | "">("");
  const [exameBase, setExameBase] = useState<number | "">("");
  const [exameComparar, setExameComparar] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [comparacoesLista, setComparacoesLista] = useState<ComparacaoExame[]>(comparacoes);

  // Filtra exames pelo paciente selecionado (para criar novas comparações)
  const examesFiltrados = useMemo(() => {
    if (!pacienteId) return exames;
    return exames.filter((e) => e.paciente?.nome === pacientes.find((p) => p.id === Number(pacienteId))?.nome);
  }, [exames, pacienteId, pacientes]);

  // Filtra as comparações pelo paciente selecionado
  const comparacoesFiltradas = useMemo(() => {
    if (!pacienteId) return comparacoesLista;
    return comparacoesLista.filter((c) => {
      const baseNome = c.exameBase?.tipoExame?.nome;
      const varNome = c.exameVar?.tipoExame?.nome;
      return baseNome !== undefined || varNome !== undefined;
    });
  }, [comparacoesLista, pacienteId]);

  async function detetarMudancas() {
    if (!exameBase || !exameComparar) {
      setErro("Selecione o exame base (antigo) e o exame a comparar (novo).");
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
      setErro(e instanceof Error ? e.message : "Erro ao detetar mudanças.");
    } finally {
      setLoading(false);
    }
  }

  async function recarregar() {
    setLoading(true);
    try {
      const lista = await listarComparacoes();
      setComparacoesLista(lista);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao recarregar comparações.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ScanSearch className="h-6 w-6 text-primary" />
            Detector Inteligente de Mudanças
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare exames antigos com novos e destaque automaticamente novas lesões, crescimento, redução, desaparecimento e alterações estruturais.
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

      {/* Filtro por paciente */}
      <CognitivoCard title="Contexto do Paciente" subtitle="Filtre os exames disponíveis para comparação">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <select
            value={pacienteId}
            onChange={(e) => {
              setPacienteId(e.target.value ? Number(e.target.value) : "");
              setExameBase("");
              setExameComparar("");
            }}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Todos os pacientes</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>{p.nome} · {p.numeroProcesso}</option>
            ))}
          </select>
        </div>
      </CognitivoCard>

      {/* Criar deteção */}
      <CognitivoCard title="Criar Nova Deteção" subtitle="Selecione o exame base (antigo) e o exame mais recente do mesmo órgão">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <select
            value={exameBase}
            onChange={(e) => setExameBase(e.target.value ? Number(e.target.value) : "")}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Exame base (antigo)</option>
            {examesFiltrados.map((e) => (
              <option key={e.id} value={e.id}>{e.tipoExame?.nome} · {e.codigo} · {formatDate(e.dataExame)}</option>
            ))}
          </select>
          <select
            value={exameComparar}
            onChange={(e) => setExameComparar(e.target.value ? Number(e.target.value) : "")}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Exame a comparar (novo)</option>
            {examesFiltrados.map((e) => (
              <option key={e.id} value={e.id}>{e.tipoExame?.nome} · {e.codigo} · {formatDate(e.dataExame)}</option>
            ))}
          </select>
          <button
            onClick={detetarMudancas}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
            Detetar
          </button>
        </div>
        {erro && <p className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertOctagon className="h-4 w-4" /> {erro}</p>}
      </CognitivoCard>

      {/* Resultados */}
      {comparacoesFiltradas.length === 0 ? (
        <CognitivoCard>
          <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <Boxes className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhuma deteção disponível</p>
            <p className="text-xs mt-1">Execute uma comparação para ver o detector de mudanças em ação.</p>
          </div>
        </CognitivoCard>
      ) : (
        comparacoesFiltradas.map((c) => {
          const res = (c.resultadoJson ?? {}) as ResultadoComparacao;
          const temAchadosBase = res.achadosBase && res.achadosBase.length > 0;
          const temAchadosComp = res.achadosComp && res.achadosComp.length > 0;
          return (
            <CognitivoCard key={c.id} title={`Deteção #${c.id}`} subtitle={`${c.exameBase?.tipoExame?.nome || "Exame"} → ${c.exameVar?.tipoExame?.nome || "Exame"}${res.intervaloDias != null ? ` · intervalo de ${res.intervaloDias} dias` : ""}`}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Exame base (antigo)</p>
                  <p className="font-medium">{c.exameBase?.codigo}</p>
                  <p className="text-xs">{c.exameBase ? formatDate(c.exameBase.dataExame) : ""}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Exame comparado (novo)</p>
                  <p className="font-medium">{c.exameVar?.codigo}</p>
                  <p className="text-xs">{c.exameVar ? formatDate(c.exameVar.dataExame) : ""}</p>
                </div>
              </div>

              {/* Indicadores de mudança */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                  <div className="flex items-center gap-2 text-red-600"><AlertOctagon className="h-4 w-4" /><span className="text-xs font-medium">Novas Lesões</span></div>
                  <p className="text-2xl font-bold mt-1">{c.novasLesoes}</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
                  <div className="flex items-center gap-2 text-amber-600"><TrendingUp className="h-4 w-4" /><span className="text-xs font-medium">Crescimento</span></div>
                  <p className="text-2xl font-bold mt-1">{c.progressao}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3">
                  <div className="flex items-center gap-2 text-emerald-600"><TrendingDown className="h-4 w-4" /><span className="text-xs font-medium">Redução</span></div>
                  <p className="text-2xl font-bold mt-1">{c.regressao}</p>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center gap-2 text-slate-600"><Eraser className="h-4 w-4" /><span className="text-xs font-medium">Desaparecidos</span></div>
                  <p className="text-2xl font-bold mt-1">{res.desaparecidos?.length ?? 0}</p>
                </div>
              </div>

              {/* Conclusão */}
              {c.conclusao && (
                <div className="mt-4 rounded-lg bg-muted/40 p-4 text-sm">
                  <span className="font-semibold">Conclusão: </span>
                  {c.conclusao}
                </div>
              )}

              {/* Detalhes das alterações destacadas */}
              {res.novasLesoes?.length || res.progressao?.length || res.regressao?.length || res.desaparecidos?.length || res.estruturais?.length ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {res.novasLesoes && res.novasLesoes.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-1">Novas lesões</p>
                      <ul className="space-y-1 text-xs">
                        {res.novasLesoes.map((l, i) => <li key={i} className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-red-500" /> {l}</li>)}
                      </ul>
                    </div>
                  )}
                  {res.progressao && res.progressao.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-amber-600 mb-1">Crescimento</p>
                      <ul className="space-y-1 text-xs">
                        {res.progressao.map((l, i) => <li key={i} className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-amber-500" /> {l}</li>)}
                      </ul>
                    </div>
                  )}
                  {res.regressao && res.regressao.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 mb-1">Redução</p>
                      <ul className="space-y-1 text-xs">
                        {res.regressao.map((l, i) => <li key={i} className="flex items-center gap-1"><TrendingDown className="h-3 w-3 text-emerald-500" /> {l}</li>)}
                      </ul>
                    </div>
                  )}
                  {res.desaparecidos && res.desaparecidos.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-1">Desaparecidos</p>
                      <ul className="space-y-1 text-xs">
                        {res.desaparecidos.map((l, i) => <li key={i} className="flex items-center gap-1"><Eraser className="h-3 w-3 text-slate-500" /> {l}</li>)}
                      </ul>
                    </div>
                  )}
                  {res.estruturais && res.estruturais.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-violet-600 mb-1">Alterações estruturais</p>
                      <ul className="space-y-1 text-xs">
                        {res.estruturais.map((l, i) => <li key={i} className="flex items-center gap-1"><Boxes className="h-3 w-3 text-violet-500" /> {l}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Regiões / achados destacados por exame */}
              {(temAchadosBase || temAchadosComp) && (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {temAchadosBase && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Achados no exame base</p>
                      <div className="flex flex-wrap gap-1.5">
                        {res.achadosBase?.map((a, i) => (
                          <span key={i} className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{a.nome} {typeof a.probabilidade === "number" ? `· ${Math.round(a.probabilidade)}%` : ""}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {temAchadosComp && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Achados no exame comparado</p>
                      <div className="flex flex-wrap gap-1.5">
                        {res.achadosComp?.map((a, i) => (
                          <span key={i} className={a.probabilidade != null && a.probabilidade > 50 ? "rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[11px] text-red-700 dark:text-red-300" : "rounded-full bg-muted px-2 py-0.5 text-[11px]"}>{a.nome} {typeof a.probabilidade === "number" ? `· ${Math.round(a.probabilidade)}%` : ""}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Plus className="h-3.5 w-3.5" />
                As regiões com alterações significativas são destacadas acima. Recomenda-se revisão do especialista
                antes de qualquer decisão clínica.
              </div>
            </CognitivoCard>
          );
        })
      )}
    </motion.div>
  );
}

