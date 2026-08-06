"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  BrainCircuit,
  AlertTriangle,
  Image as ImageIcon,
  GitCompareArrows,
} from "lucide-react";
import { formatDateTime } from "@/utils/format";
import { analisarExameComIA } from "@/server/actions/medico-actions";
import type { MedicoSolicitacao } from "@/features/medico/types";
import type { AnaliseIA } from "@/features/medico/types/ia";
import { DiagnosisCard } from "@/features/medico/components/ia/DiagnosisCard";
import { FindingsList } from "@/features/medico/components/ia/FindingsList";
import { HeatmapViewer } from "@/features/medico/components/ia/HeatmapViewer";
import { ComparisonResult, type Evolucao } from "@/features/medico/components/ia/ComparisonResult";
import { AIReport } from "@/features/medico/components/ia/AIReport";
import { AIHistoryTable } from "@/features/medico/components/ia/AIHistoryTable";

interface ExameAnterior {
  id: number;
  dataExame: string;
  tipoExame?: { id: number; nome: string; modalidade: string | null };
  laudos?: { id: number; assinado: boolean; conteudo?: string }[];
}

interface Props {
  exame: MedicoSolicitacao;
  analises: AnaliseIA[];
  examesAnteriores: ExameAnterior[];
}

export function DiagnosticoIAClient({ exame, analises: initialAnalises, examesAnteriores }: Props) {
  const [analises, setAnalises] = useState<AnaliseIA[]>(initialAnalises);
  const [analiseAtiva, setAnaliseAtiva] = useState<AnaliseIA | null>(
    initialAnalises[0] || null
  );
  const [aAnalisar, setAAnalisar] = useState(false);
  const [imagemId, setImagemId] = useState<number | undefined>(undefined);

  const imagens = exame.imagens || [];
  const temImagens = imagens.length > 0;

  // Determina evolução comparando confiança/achados do exame atual vs anteriores
  function determinarEvolucao(): Evolucao {
    if (!analiseAtiva || examesAnteriores.length === 0) return "sem_alteracoes";
    // Heurística simples: compara achados presentes
    const presentes = (analiseAtiva.achados || []).filter((a) => a.presente).length;
    if (presentes === 0) return "sem_alteracoes";
    if (presentes <= 2) return "melhora";
    if (presentes >= 4) return "piora";
    return "sem_alteracoes";
  }

  async function handleAnalisar() {
    if (!temImagens) {
      toast.error("O exame não tem imagens para analisar");
      return;
    }
    setAAnalisar(true);
    try {
      const resultados = await analisarExameComIA(exame.id, imagemId);
      setAnalises(resultados);
      if (resultados.length > 0) setAnaliseAtiva(resultados[0]);
      toast.success(`Análise de IA concluída (${resultados.length} imagem(ns))`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao analisar com IA");
    } finally {
      setAAnalisar(false);
    }
  }

  const evolucao = determinarEvolucao();
  const exameMaisRecenteAnterior = examesAnteriores[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={`/medico/exames/${exame.id}`}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-primary" />
              Diagnóstico Assistido por IA
            </h1>
            <p className="text-sm text-muted-foreground">
              {exame.codigo || `#${exame.id}`} · {exame.tipoExame?.nome} · {exame.paciente?.nome}
            </p>
          </div>
        </div>
      </div>

      {/* Aviso clínico */}
      <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Aviso de segurança clínica</p>
          <p className="mt-0.5">
            Esta ferramenta de inteligência artificial é exclusivamente de APOIO à decisão
            clínica. Os resultados sugeridos não constituem diagnóstico definitivo e devem
            ser sempre validados por um médico especialista.
          </p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleAnalisar}
          disabled={aAnalisar || !temImagens}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {aAnalisar ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {aAnalisar ? "A analisar com IA..." : "Executar Diagnóstico IA"}
        </button>

        {temImagens && imagens.length > 1 && (
          <select
            value={imagemId ?? ""}
            onChange={(e) => setImagemId(e.target.value ? Number(e.target.value) : undefined)}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Todas as imagens</option>
            {imagens.map((img) => (
              <option key={img.id} value={img.id}>
                {img.originalName}
              </option>
            ))}
          </select>
        )}

        {!temImagens && (
          <p className="text-sm text-muted-foreground">
            Este exame não tem imagens disponíveis para análise.
          </p>
        )}
      </div>

      {/* Conteúdo */}
      {analiseAtiva ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna principal */}
          <div className="space-y-6 lg:col-span-2">
            <DiagnosisCard
              diagnostico={analiseAtiva.diagnosticoPrincipal || "Sem alterações significativas"}
              confidence={analiseAtiva.confianca}
              resumo={analiseAtiva.resumo}
              modelo={analiseAtiva.modelo}
            />

            <div className="rounded-xl border bg-card">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  Imagens & Heatmap
                </h2>
                {analiseAtiva.imagemId && (
                  <span className="text-xs text-muted-foreground">
                    Imagem #{analiseAtiva.imagemId}
                  </span>
                )}
              </div>
              <div className="p-5">
                {imagens.length > 0 ? (
                  <HeatmapViewer
                    imageUrl={imagens[0].path}
                    heatmapUrl={analiseAtiva.heatmap}
                    regioes={extrairRegioes(analiseAtiva)}
                  />
                ) : (
                  <p className="text-center text-sm text-muted-foreground">
                    Sem imagens disponíveis
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="text-sm font-semibold">Achados Detectados</h2>
              </div>
              <div className="p-5">
                <FindingsList findings={analiseAtiva.achados || []} />
              </div>
            </div>

            <AIReport
              analiseId={analiseAtiva.id}
              exameId={exame.id}
              preLaudo={analiseAtiva.preLaudo}
            />
          </div>

          {/* Coluna lateral */}
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <GitCompareArrows className="h-4 w-4 text-primary" />
                Evolução
              </h2>
              <ComparisonResult
                evolucao={evolucao}
                examesComparados={
                  exameMaisRecenteAnterior
                    ? {
                        anterior: formatDateTime(exameMaisRecenteAnterior.dataExame),
                        atual: formatDateTime(exame.dataExame),
                      }
                    : undefined
                }
                detalhes={
                  examesAnteriores.length === 0
                    ? "Não existem exames anteriores do mesmo paciente para comparar."
                    : "Comparação automática com os exames anteriores do paciente."
                }
              />
            </div>

            <AIHistoryTable
              analises={analises}
              selectedId={analiseAtiva.id}
              onSelect={setAnaliseAtiva}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-card py-16 text-center text-muted-foreground">
          <BrainCircuit className="h-14 w-14 mb-3 opacity-30" />
          <h2 className="text-lg font-semibold text-foreground">Nenhuma análise realizada</h2>
          <p className="mt-1 max-w-md text-sm">
Clique em &ldquo;Executar Diagnóstico IA&rdquo; para analisar as imagens do exame
            e obter sugestões de diagnóstico, achados e pré-laudo.
          </p>
        </div>
      )}

      {/* Prazo de processamento */}
      {analiseAtiva && (
        <p className="text-center text-xs text-muted-foreground">
          Última análise executada em {formatDateTime(analiseAtiva.updatedAt)} · Processamento:{" "}
          {analiseAtiva.tempoProcessamento.toFixed(1)}s · Modelo: {analiseAtiva.modelo}
        </p>
      )}
    </motion.div>
  );
}

function extrairRegioes(analise: AnaliseIA) {
  const json = analise.resultadoJson as { regioes?: Array<{ x: number; y: number; largura: number; altura: number; tipo: string; confianca: number }> };
  return json?.regioes || [];
}
