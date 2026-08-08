"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Loader2, Sparkles, AlertOctagon, History } from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import { gerarPrevisao, listarPrevisoes } from "@/server/actions/cognitivo-actions";
import type { ResultadoPrevisao } from "@/features/cognitivo/types";
import { formatDate } from "@/utils/format";

interface PrevisaoHistorico {
  id: number;
  tipo: string;
  periodo: string;
  confianca: number;
  criadoEm: string;
  resultado: Record<string, unknown>;
}

const tipos = [
  { value: "sobrecarga", label: "Sobrecarga do serviço" },
  { value: "fila", label: "Fila de espera" },
  { value: "equipamento", label: "Uso de equipamentos" },
  { value: "ocupacao", label: "Ocupação" },
  { value: "tempo_espera", label: "Tempo de espera" },
  { value: "demanda", label: "Demanda futura" },
];

export function PrevisaoClient() {
  const [tipo, setTipo] = useState("demanda");
  const [periodo, setPeriodo] = useState("30");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoPrevisao | null>(null);
  const [historico, setHistorico] = useState<PrevisaoHistorico[] | null>(null);

  async function prever() {
    setLoading(true);
    setErro(null);
    try {
      const res = await gerarPrevisao({ tipo, periodo });
      setResultado(res);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar previsão.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarHistorico() {
    setErro(null);
    try {
      const data = await listarPrevisoes();
      setHistorico(data as unknown as PrevisaoHistorico[]);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar histórico.");
    }
  }

  const maxValor = resultado ? Math.max(...resultado.pontos.map((p) => p.valor), 1) : 1;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Previsão Inteligente
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Projete a demanda, fila, ocupação e sobrecarga do serviço com base no histórico real.
          </p>
        </div>
        <button
          onClick={carregarHistorico}
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
        >
          <History className="h-3.5 w-3.5" /> Histórico
        </button>
      </div>

      {/* Parâmetros */}
      <CognitivoCard title="Gerar Previsão" subtitle="Configure o tipo e o horizonte da projeção">
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {tipos.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="7">7 dias</option>
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
            <option value="180">180 dias</option>
          </select>
          <button
            onClick={prever}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Prever
          </button>
        </div>
        {erro && <p className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertOctagon className="h-4 w-4" /> {erro}</p>}
      </CognitivoCard>

      {/* Resultado */}
      {resultado && (
        <>
          <div className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold capitalize">{tipos.find((t) => t.value === resultado.tipo)?.label || resultado.tipo}</p>
                <p className="text-xs text-muted-foreground">Horizonte: {resultado.periodo} dias</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Confiança</p>
                <p className="text-xl font-bold text-primary">{Math.round(resultado.confianca * 100)}%</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{resultado.resumo}</p>
          </div>

          <CognitivoCard title="Projeção" subtitle="Valores reais (sólidos) e previsões (tracejados)">
            <div className="flex items-end gap-1.5 h-40">
              {resultado.pontos.map((p, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t ${p.previsao ? "bg-primary/60 border-t-2 border-primary" : "bg-primary"}`}
                    style={{ height: `${Math.max(4, (p.valor / maxValor) * 100)}%` }}
                    title={`${p.label}: ${p.valor}${p.previsao ? " (previsão)" : ""}`}
                  />
                  {i % Math.ceil(resultado.pontos.length / 10) === 0 && (
                    <span className="text-[9px] text-muted-foreground">{p.label}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary inline-block" /> Valor real</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary/60 border border-primary inline-block" /> Previsão</span>
            </div>
          </CognitivoCard>
        </>
      )}

      {/* Histórico */}
      {historico && (
        <CognitivoCard title="Previsões Anteriores" subtitle="Últimas projeções geradas">
          {historico.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não existem previsões registadas.</p>
          ) : (
            <div className="space-y-2">
              {historico.map((h) => (
                <div key={h.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium capitalize">{tipos.find((t) => t.value === h.tipo)?.label || h.tipo}</p>
                    <p className="text-xs text-muted-foreground">{h.periodo} dias · {formatDate(h.criadoEm)}</p>
                  </div>
                  <span className="text-xs font-medium text-primary">{Math.round(h.confianca * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </CognitivoCard>
      )}

      {!resultado && !historico && !loading && (
        <CognitivoCard>
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <TrendingUp className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Gere uma previsão</p>
            <p className="text-xs mt-1">Baseada no histórico real de exames do hospital.</p>
          </div>
        </CognitivoCard>
      )}
    </motion.div>
  );
}

export default PrevisaoClient;
