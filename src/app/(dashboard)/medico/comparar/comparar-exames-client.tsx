"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  GitCompareArrows,
  Search,
  Image as ImageIcon,
  Brain,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Stethoscope,
  X,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";
import type { MedicoSolicitacao } from "@/features/medico/types";
import { diagnosticarMultiplasImagens } from "@/features/imagens/services/ml-service";
import type { MLDiagnostico } from "@/features/imagens/types";

interface Props {
  exames: MedicoSolicitacao[];
}

interface ExameComparavel {
  id: number;
  nome: string;
  data: string;
  pacienteNome: string;
  pacienteId: number;
  imagens: { id: number; url: string; name: string }[];
}

export function CompararExamesClient({ exames }: Props) {
  const [search, setSearch] = useState("");
  const [esquerda, setEsquerda] = useState<ExameComparavel | null>(null);
  const [direita, setDireita] = useState<ExameComparavel | null>(null);

  const examesComparaveis: ExameComparavel[] = useMemo(
    () =>
      exames.map((e) => ({
        id: e.id,
        nome: e.tipoExame?.nome || "Exame",
        data: e.dataExame,
        pacienteNome: e.paciente?.nome || "",
        pacienteId: e.paciente?.id || 0,
        imagens: (e.imagens || []).map((img) => ({
          id: img.id,
          url: img.path,
          name: img.originalName,
        })),
      })),
    [exames]
  );

  const filtrados = useMemo(() => {
    if (!search.trim()) return examesComparaveis;
    const q = search.toLowerCase();
    return examesComparaveis.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        e.pacienteNome.toLowerCase().includes(q)
    );
  }, [examesComparaveis, search]);

  const selecionar = (lado: "esquerda" | "direita", exame: ExameComparavel) => {
    if (lado === "esquerda") setEsquerda(exame);
    else setDireita(exame);
  };

const mesmaDataTipo = esquerda && direita && esquerda.nome === direita.nome;

  // ---- Análise comparativa com IA ----
  const [iaLoading, setIaLoading] = useState(false);
  const [iaErro, setIaErro] = useState<string | null>(null);
  const [diagnosticos, setDiagnosticos] = useState<Record<number, MLDiagnostico>>({});
  const [comparacaoIA, setComparacaoIA] = useState<{
    resumo: string;
    achadosMudaram: string[];
    tendencia: "melhorou" | "piorou" | "estavel" | "nova";
    risco: "baixo" | "moderado" | "elevado";
  } | null>(null);

  const temImagens = esquerda?.imagens.length && direita?.imagens.length;

  const analisarComIA = async () => {
    if (!esquerda || !direita || iaLoading) return;
    setIaLoading(true);
    setIaErro(null);
    setComparacaoIA(null);
    try {
      const itens = [esquerda, direita]
        .filter((e) => e.imagens.length > 0)
        .map((e) => ({
          id: e.id,
          path: e.imagens[0].url,
          tipoExameNome: e.nome,
        }));

      if (itens.length === 0) {
        setIaErro("É necessário que ambos os exames tenham imagens para análise por IA.");
        return;
      }

      const resultados = await diagnosticarMultiplasImagens(itens);
      const mapa: Record<number, MLDiagnostico> = {};
      resultados.forEach((r) => {
        mapa[r.imagemId] = r;
      });
      setDiagnosticos(mapa);

      // Gerar resumo comparativo
      const diagA = mapa[esquerda.id];
      const diagB = mapa[direita.id];

      if (diagA && diagB) {
        const achadosA = diagA.diagnosticoPrincipal;
        const achadosB = diagB.diagnosticoPrincipal;
        const confA = diagA.confiancaDiagnostico;
        const confB = diagB.confiancaDiagnostico;

        const achadosMudaram: string[] = [];
        if (achadosA || achadosB) {
          if (achadosA && !achadosB) {
            achadosMudaram.push(`Achado "${achadosA}" já não detetado no exame mais recente.`);
          } else if (!achadosA && achadosB) {
            achadosMudaram.push(`Novo achado detetado: "${achadosB}".`);
          } else if (achadosA && achadosB && achadosA !== achadosB) {
            achadosMudaram.push(`Diagnóstico evoluído de "${achadosA}" para "${achadosB}".`);
          } else if (achadosA && achadosB) {
            achadosMudaram.push(`O achado "${achadosA}" mantém-se, com confiança ${confA}% → ${confB}%.`);
          }
        }

        let tendencia: "melhorou" | "piorou" | "estavel" | "nova" = "estavel";
        if (confB > confA + 10) tendencia = "piorou";
        else if (confA > confB + 10) tendencia = "melhorou";
        else if (achadosB && !achadosA) tendencia = "nova";

        const riscos: ("leve" | "moderado" | "severo")[] = [...diagA.achados, ...diagB.achados].map((a) => a.gravidade);
        let risco: "baixo" | "moderado" | "elevado" = "baixo";
        if (riscos.includes("severo")) risco = "elevado";
        else if (riscos.includes("moderado")) risco = "moderado";

        const resumo =
          achadosMudaram.length > 0
            ? achadosMudaram.join(" ")
            : "Não foram detetadas alterações clínicas significativas entre os dois exames por análise automática.";

        setComparacaoIA({ resumo, achadosMudaram, tendencia, risco });
      }
    } catch (err) {
      setIaErro(err instanceof Error ? err.message : "Erro ao analisar com IA");
    } finally {
      setIaLoading(false);
    }
  };

  const limparIA = () => {
    setDiagnosticos({});
    setComparacaoIA(null);
    setIaErro(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link href="/medico" className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitCompareArrows className="h-6 w-6 text-primary" />
            Comparar Exames
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare exames realizados em diferentes datas.
          </p>
        </div>
      </div>

      {/* Seleção */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(["esquerda", "direita"] as const).map((lado) => {
          const selecionado = lado === "esquerda" ? esquerda : direita;
          return (
            <div key={lado} className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold mb-3">
                {lado === "esquerda" ? "Exame A" : "Exame B"}
              </h2>

              {selecionado ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-3">
                    <div>
                      <p className="text-sm font-medium">{selecionado.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {selecionado.pacienteNome} · {formatDate(selecionado.data)}
                      </p>
                    </div>
                    <button
                      onClick={() => lado === "esquerda" ? setEsquerda(null) : setDireita(null)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                  {selecionado.imagens.length > 0 ? (
                    <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={selecionado.imagens[0].url}
                        alt={selecionado.nome}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-1 opacity-30" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Pesquisar exame por paciente ou tipo..."
                      value={lado === "esquerda" ? search : search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
                    {filtrados.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Nenhum exame encontrado
                      </div>
                    ) : (
                      filtrados.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => selecionar(lado, e)}
                          className="w-full px-4 py-2.5 text-left hover:bg-accent transition-colors"
                        >
                          <p className="text-sm font-medium">{e.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.pacienteNome} · {formatDate(e.data)}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparação lado a lado */}
      {esquerda && direita && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Comparação</h2>
            {mesmaDataTipo && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Mesmo tipo de exame
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[esquerda, direita].map((exame) => (
              <div key={exame.id}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">{exame.nome}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(exame.data)}</p>
                </div>
                {exame.imagens.length > 0 ? (
                  <div className="aspect-video overflow-hidden rounded-lg border bg-black/5">
                    <img
                      src={exame.imagens[0].url}
                      alt={exame.nome}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-30" />
                  </div>
                )}
              </div>
            ))}
          </div>

<div className="mt-4 flex justify-center">
            <GitCompareArrows className="h-6 w-6 text-primary" />
          </div>

          {/* Análise comparativa com IA */}
          <div className="mt-5 border-t pt-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold">Análise Comparativa com IA</h3>
              </div>
              <div className="flex items-center gap-2">
                {Object.keys(diagnosticos).length > 0 && (
                  <button
                    onClick={limparIA}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Limpar
                  </button>
                )}
                <button
                  onClick={analisarComIA}
                  disabled={iaLoading || !temImagens}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  title={!temImagens ? "Ambos os exames precisam de imagens" : "Analisar diferenças com IA"}
                >
                  {iaLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Stethoscope className="h-3.5 w-3.5" />
                  )}
                  {iaLoading ? "A analisar..." : "Analisar com IA"}
                </button>
              </div>
            </div>

            {iaErro && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 p-3">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300">{iaErro}</p>
              </div>
            )}

            {/* Resultado da análise */}
            <AnimatePresence>
              {comparacaoIA && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="mt-4 space-y-4"
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    {/* Tendência */}
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">Tendência</p>
                      <div className="flex items-center gap-2">
                        {comparacaoIA.tendencia === "melhorou" && (
                          <>
                            <TrendingDown className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-semibold text-green-600">Melhorou</span>
                          </>
                        )}
                        {comparacaoIA.tendencia === "piorou" && (
                          <>
                            <TrendingUp className="h-5 w-5 text-red-600" />
                            <span className="text-sm font-semibold text-red-600">Piorou</span>
                          </>
                        )}
                        {comparacaoIA.tendencia === "estavel" && (
                          <>
                            <Minus className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm font-semibold text-muted-foreground">Estável</span>
                          </>
                        )}
                        {comparacaoIA.tendencia === "nova" && (
                          <>
                            <Activity className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm font-semibold text-yellow-600">Novo achado</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Risco */}
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">Risco clínico</p>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          comparacaoIA.risco === "baixo"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : comparacaoIA.risco === "moderado"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        )}
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {comparacaoIA.risco === "baixo"
                          ? "Baixo"
                          : comparacaoIA.risco === "moderado"
                            ? "Moderado"
                            : "Elevado"}
                      </span>
                    </div>

                    {/* Imagens analisadas */}
                    <div className="rounded-lg border p-3">
                      <p className="text-[10px] text-muted-foreground mb-1">Imagens analisadas</p>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold">
                          {Object.keys(diagnosticos).length} de 2
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Resumo */}
                  <div className="rounded-lg border bg-primary/5 p-3">
                    <div className="flex items-start gap-2">
                      <Brain className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium mb-1">Resumo da IA</p>
                        <p className="text-xs text-muted-foreground">{comparacaoIA.resumo}</p>
                      </div>
                    </div>
                  </div>

                  {/* Achados que mudaram */}
                  {comparacaoIA.achadosMudaram.length > 0 && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-medium mb-2 flex items-center gap-1.5">
                        <Activity className="h-4 w-4 text-primary" />
                        Alterações detetadas
                      </p>
                      <ul className="space-y-1.5">
                        {comparacaoIA.achadosMudaram.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span
                              className={cn(
                                "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                                comparacaoIA.risco === "elevado" ? "bg-red-500" : "bg-primary"
                              )}
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Aviso de segurança clínica */}
                  <div className="rounded-lg border-2 border-amber-300/60 bg-amber-50 dark:bg-amber-900/20 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        ⚠️ Ferramenta experimental de APOIO à decisão. A análise comparativa é gerada
                        automaticamente e NÃO substitui a avaliação de um médico especialista. Os achados
                        devem ser correlacionados com o contexto clínico.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {!esquerda || !direita ? (
        <div className="rounded-xl border border-dashed bg-card/50 p-8 text-center text-muted-foreground">
          <GitCompareArrows className="mx-auto h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm">
            Selecione dois exames {esquerda ? "(faltam o Exame B)" : "(faltam o Exame A)"} para comparar.
          </p>
        </div>
      ) : null}
    </motion.div>
  );
}
