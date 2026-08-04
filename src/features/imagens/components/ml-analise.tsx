"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Loader2,
  BarChart3,
  Image as ImageIcon,
  ScanLine,
  SunMedium,
  Contrast,
  X,
  AlertCircle,
  CheckCircle2,
  Activity,
  Stethoscope,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { diagnosticarImagem } from "../services/ml-service";
import type { MLDiagnostico, MLAchado } from "../types";

interface MLAnaliseProps {
  imagemId: number;
  imageUrl: string;
  imageName: string;
  tipoExame?: string;
}

function GravidadeBadge({ gravidade }: { gravidade: MLAchado["gravidade"] }) {
  const colors = {
    leve: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    moderado: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    severo: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", colors[gravidade])}>
      {gravidade === "leve" && "Leve"}
      {gravidade === "moderado" && "Moderado"}
      {gravidade === "severo" && "Severo"}
    </span>
  );
}

export function MLAnalise({ imagemId, imageUrl, imageName, tipoExame }: MLAnaliseProps) {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<MLDiagnostico | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [expandido, setExpandido] = useState(false);

  const handleAnalisar = useCallback(async () => {
    if (loading || resultado) return;
    setLoading(true);
    setErro(null);
    try {
      const res = await diagnosticarImagem(imagemId, imageUrl, tipoExame);
      setResultado(res);
      setExpandido(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao diagnosticar imagem");
    } finally {
      setLoading(false);
    }
  }, [imagemId, imageUrl, tipoExame, loading, resultado]);

  const reset = () => {
    setResultado(null);
    setErro(null);
    setExpandido(false);
  };

  return (
    <div className="relative">
      {/* Botao de diagnostico */}
      <button
        onClick={handleAnalisar}
        disabled={loading}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
          resultado
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : erro
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "bg-primary/10 text-primary hover:bg-primary/20"
        )}
        title={resultado ? "Clique para ver diagnostico" : "Diagnosticar com IA"}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : resultado ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : erro ? (
          <AlertCircle className="h-3.5 w-3.5" />
        ) : (
          <Stethoscope className="h-3.5 w-3.5" />
        )}
        {loading ? "A diagnosticar..." : resultado ? "Diagnosticado" : erro ? "Erro" : "Diagnostico"}
      </button>

      {/* Painel de diagnostico */}
      <AnimatePresence>
        {expandido && resultado && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-4 z-50 flex items-center justify-center"
            onClick={() => setExpandido(false)}
          >
            <div
              className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border bg-card shadow-2xl p-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Diagnostico por IA</h3>
                  {resultado.modalidade && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      {resultado.modalidade}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setExpandido(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-4 space-y-5">
                {/* Nome do ficheiro */}
                <p className="text-xs text-muted-foreground truncate">{imageName}</p>

                {/* Diagnostico Principal */}
                {resultado.diagnosticoPrincipal && (
                  <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                      <h4 className="font-semibold text-sm">Diagnostico Principal</h4>
                    </div>
                    <p className="text-lg font-bold text-primary">
                      {resultado.diagnosticoPrincipal}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${resultado.confiancaDiagnostico}%` }}
                          transition={{ duration: 0.6 }}
                          className={cn(
                            "h-full rounded-full",
                            resultado.confiancaDiagnostico > 70 ? "bg-green-500" :
                            resultado.confiancaDiagnostico > 40 ? "bg-yellow-500" : "bg-muted-foreground/30"
                          )}
                        />
                      </div>
                      <span className="text-xs font-medium">{resultado.confiancaDiagnostico}% confianca</span>
                    </div>
                  </div>
                )}

                {/* Resumo */}
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-start gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">{resultado.resumo}</p>
                  </div>
                </div>

                {/* Achados */}
                {resultado.achados.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-primary" />
                      Achados Radiologicos
                    </h4>
                    <div className="space-y-2">
                      {resultado.achados.map((achado, idx) => (
                        <div key={idx} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{achado.tipo}</span>
                              <GravidadeBadge gravidade={achado.gravidade} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              {achado.confianca}%
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">{achado.descricao}</p>
                          {achado.localizacao && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Localizacao: {achado.localizacao}
                            </p>
                          )}
                          <div className="mt-1.5 h-1 w-full rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${achado.confianca}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.1 }}
                              className={cn(
                                "h-full rounded-full",
                                achado.confianca > 70 ? "bg-green-500" :
                                achado.confianca > 40 ? "bg-yellow-500" : "bg-muted-foreground/30"
                              )}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recomendacoes */}
                {resultado.recomendacoes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" />
                      Recomendacoes
                    </h4>
                    <ul className="space-y-1">
                      {resultado.recomendacoes.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Regioes de Interesse */}
                {resultado.regioesInteresse.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                      <ScanLine className="h-4 w-4 text-primary" />
                      Regioes de Interesse ({resultado.regioesInteresse.length})
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {resultado.regioesInteresse.map((regiao, idx) => (
                        <div key={idx} className="rounded-lg border p-2 text-center">
                          <div className="relative aspect-square mb-1 rounded bg-muted overflow-hidden">
                            <div
                              className="absolute bg-red-500/30 border border-red-500 rounded"
                              style={{
                                left: `${regiao.x * 100}%`,
                                top: `${regiao.y * 100}%`,
                                width: `${regiao.largura * 100}%`,
                                height: `${regiao.altura * 100}%`,
                                transform: "translate(-50%, -50%)",
                              }}
                            />
                          </div>
                          <p className="text-[9px] text-muted-foreground">{regiao.confianca}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadados */}
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Metadados da Imagem
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg border p-2.5">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                        <ScanLine className="h-3 w-3" />
                        Dimensoes
                      </div>
                      <p className="text-xs font-medium">
                        {resultado.metadados.dimensoes.largura}x{resultado.metadados.dimensoes.altura}
                      </p>
                    </div>
                    <div className="rounded-lg border p-2.5">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                        <SunMedium className="h-3 w-3" />
                        Brilho
                      </div>
                      <p className="text-xs font-medium">{resultado.metadados.brilhoMedio}%</p>
                    </div>
                    <div className="rounded-lg border p-2.5">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                        <Contrast className="h-3 w-3" />
                        Contraste
                      </div>
                      <p className="text-xs font-medium">{resultado.metadados.contraste}%</p>
                    </div>
                    <div className="rounded-lg border p-2.5">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5">
                        <ImageIcon className="h-3 w-3" />
                        Nitidez
                      </div>
                      <p className="text-xs font-medium">{resultado.metadados.nitidez}%</p>
                    </div>
                  </div>
                </div>

                {/* Timestamp */}
                <p className="text-[10px] text-muted-foreground text-right">
                  Processado: {new Date(resultado.processadoEm).toLocaleString("pt-PT")}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tooltip de erro */}
      <AnimatePresence>
        {erro && !expandido && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute left-0 top-full mt-1 z-40 w-48 rounded-lg border bg-card p-2 shadow-lg"
          >
            <p className="text-[10px] text-destructive">{erro}</p>
            <button onClick={reset} className="text-[10px] text-primary hover:underline mt-1">
              Tentar novamente
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

