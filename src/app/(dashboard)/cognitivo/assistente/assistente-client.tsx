"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope,
  Loader2,
  Sparkles,
  AlertOctagon,
  FileText,
  ShieldCheck,
  GitCompareArrows,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import { gerarExplicacaoClinica } from "@/server/actions/cognitivo-actions";
import { formatDate } from "@/utils/format";

interface ExameSelecao {
  id: number;
  codigo: string | null;
  dataExame: string;
  estado: string;
  paciente?: { nome: string };
  tipoExame?: { nome: string };
}

interface Achado {
  nome?: string;
  probabilidade?: number;
  confianca?: number;
  descricao?: string;
}

interface ResultadoExplicacao {
  resumo: string;
  confianca: number;
  explicacao: string;
  achados: Achado[];
  exameId: number;
}

interface Props {
  exames: ExameSelecao[];
}

export function AssistenteClient({ exames }: Props) {
  const [exameId, setExameId] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoExplicacao | null>(null);

  async function gerar() {
    if (!exameId) {
      setErro("Selecione um exame para gerar a explicação clínica.");
      return;
    }
    setLoading(true);
    setErro(null);
    setResultado(null);
    try {
      const res = await gerarExplicacaoClinica(Number(exameId));
      setResultado(res as ResultadoExplicacao);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao gerar a explicação clínica.");
    } finally {
      setLoading(false);
    }
  }

  const exameSelecionado = exameId ? exames.find((e) => e.id === Number(exameId)) : undefined;
  const nivelConfianca =
    resultado && resultado.confianca >= 80
      ? { label: "Alta", cor: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800" }
      : resultado && resultado.confianca >= 60
      ? { label: "Moderada", cor: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" }
      : { label: "Baixa", cor: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          Assistente Clínico Explicável
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gera explicações clínicas transparentes e legíveis por exame, com achados, confiança e comparação com o exame anterior.
        </p>
      </div>

      {/* Seleção de exame */}
      <CognitivoCard
        title="Selecionar Exame"
        subtitle="Escolha um exame do histórico para obter a explicação clínica detalhada"
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <select
            value={exameId}
            onChange={(e) => {
              setExameId(e.target.value ? Number(e.target.value) : "");
              setResultado(null);
              setErro(null);
            }}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Selecione um exame...</option>
            {exames.map((e) => (
              <option key={e.id} value={e.id}>
                {e.tipoExame?.nome || "Exame"} · {e.codigo || `#${e.id}`} · {e.paciente?.nome || ""} · {formatDate(e.dataExame)}
              </option>
            ))}
          </select>
          <button
            onClick={gerar}
            disabled={loading || !exameId}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Explicar
          </button>
        </div>
        {exameSelecionado && !resultado && !loading && (
          <p className="mt-3 text-xs text-muted-foreground">
            Exame <span className="font-medium">{exameSelecionado.codigo || `#${exameSelecionado.id}`}</span> · {exameSelecionado.tipoExame?.nome || "—"} · {formatDate(exameSelecionado.dataExame)}
          </p>
        )}
        {erro && (
          <p className="mt-3 flex items-center gap-2 text-sm text-red-600">
            <AlertOctagon className="h-4 w-4" /> {erro}
          </p>
        )}
      </CognitivoCard>

      {/* Resultado */}
      {resultado && (
        <div className="space-y-6">
          {/* Resumo + confiança */}
          <CognitivoCard title="Resumo da Análise" subtitle={exameSelecionado ? `${exameSelecionado.tipoExame?.nome} · ${formatDate(exameSelecionado.dataExame)}` : undefined}>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <div>
<p className="text-sm leading-relaxed">{resultado.resumo}</p>
                <div className="mt-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Explicação gerada a partir dos dados reais do exame e da análise de IA.</span>
                </div>
              </div>
              <div className={`flex h-fit flex-col items-center justify-center rounded-lg border px-5 py-4 ${nivelConfianca.bg}`}>
                <span className={`text-2xl font-bold ${nivelConfianca.cor}`}>{Math.round(resultado.confianca * 100)}%</span>
                <span className="mt-0.5 text-xs font-medium text-muted-foreground">Confiança {nivelConfianca.label}</span>
              </div>
            </div>
          </CognitivoCard>

          {/* Explicação detalhada */}
          <CognitivoCard title="Explicação Detalhada" subtitle="Passos que sustentam o resumo, de forma transparente e audível">
            <div className="space-y-3 text-sm leading-relaxed">
              {resultado.explicacao.split("\n").map((linha, i) => {
                if (!linha.trim()) return null;
                if (linha.startsWith("- ")) {
                  const semBullet = linha.slice(2);
                  return (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{renderInline(semBullet)}</span>
                    </div>
                  );
                }
                return (
                  <p key={i} className="text-slate-700 dark:text-slate-300">
                    {renderInline(linha)}
                  </p>
                );
              })}
            </div>
          </CognitivoCard>

          {/* Achados relevantes */}
          {resultado.achados.length > 0 && (
            <CognitivoCard title="Achados Relevantes" subtitle="Detalhes e nível de confiança de cada achado">
              <div className="grid gap-3 sm:grid-cols-2">
                {resultado.achados.map((a, i) => {
                  const prob = typeof a.probabilidade === "number" ? a.probabilidade : a.confianca || 0;
                  const presente = prob > 50;
                  return (
                    <div key={i} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium">{a.nome || "Achado"}</span>
                        {presente ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-[11px] text-red-700 dark:text-red-300">
                            <AlertOctagon className="h-3 w-3" /> Presente
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                            <XCircle className="h-3 w-3" /> Não evidenciado
                          </span>
                        )}
                      </div>
                      {prob > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                            <span>Confiança</span>
                            <span className="font-medium">{Math.round(prob)}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${presente ? "bg-red-500" : "bg-muted-foreground/40"}`}
                              style={{ width: `${Math.min(100, Math.round(prob))}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {a.descricao && <p className="mt-2 text-xs text-muted-foreground">{a.descricao}</p>}
                    </div>
                  );
                })}
              </div>
            </CognitivoCard>
          )}

          {/* Nota de responsabilidade */}
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-xs text-amber-800 dark:text-amber-200">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-semibold">Responsabilidade clínica:</span> A explicação acima é gerada por IA como apoio à decisão.
              A interpretação definitiva e a decisão clínica são da exclusiva responsabilidade do médico especialista.
            </p>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!resultado && !loading && (
        <CognitivoCard>
          <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <GitCompareArrows className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhuma explicação gerada</p>
<p className="text-xs mt-1">Selecione um exame e clique em &ldquo;Explicar&rdquo; para ver a explicação clínica detalhada.</p>
          </div>
        </CognitivoCard>
      )}
    </motion.div>
  );
}

/** Renderiza texto com marcação leve de negrito (**texto**) e itálico (*texto*). */
function renderInline(texto: string) {
  const partes = texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return partes.map((parte, i) => {
    if (parte.startsWith("**") && parte.endsWith("**")) {
      return <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">{parte.slice(2, -2)}</strong>;
    }
    if (parte.startsWith("*") && parte.endsWith("*") && parte.length > 2) {
      return <em key={i}>{parte.slice(1, -1)}</em>;
    }
    return <span key={i}>{parte}</span>;
  });
}

export default AssistenteClient;
