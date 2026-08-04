"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  X,
  Loader2,
  Download,
  Brain,
  Stethoscope,
  AlertTriangle,
  Activity,
  BarChart3,
  Calendar,
  Image as ImageIcon,
  FileSpreadsheet,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { diagnosticarMultiplasImagens } from "../services/ml-service";
import type { MLDiagnostico } from "../types";

interface ImagemRelatorio {
  id: number;
  path: string;
  originalName: string;
  filename: string;
  tamanho: number;
  createdAt: string;
  exame: {
    id: number;
    paciente: { id: number; nome: string };
    tipoExame: { id: number; nome: string };
  };
}

interface ModalRelatorioImagensProps {
  open: boolean;
  onClose: () => void;
  imagens: ImagemRelatorio[];
}

function formatarData(d: string): string {
  try {
    return new Date(d).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function GravidadeBadge({ gravidade }: { gravidade: "leve" | "moderado" | "severo" }) {
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

export function ModalRelatorioImagens({ open, onClose, imagens }: ModalRelatorioImagensProps) {
  const [diagnosticos, setDiagnosticos] = useState<MLDiagnostico[]>([]);
  const [loading, setLoading] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [gerado, setGerado] = useState(false);
  const relatorioRef = useRef<HTMLDivElement>(null);

  const handleGerarRelatorio = useCallback(async () => {
    if (loading || gerado) return;
    setLoading(true);
    setErro(null);
    setProgresso(0);

    try {
      const imagensParaAnalisar = imagens.map((img) => ({
        id: img.id,
        path: img.path,
        tipoExameNome: img.exame.tipoExame.nome,
      }));

      const resultados = await diagnosticarMultiplasImagens(imagensParaAnalisar);
      setDiagnosticos(resultados);
      setGerado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar relatorio");
    } finally {
      setLoading(false);
      setProgresso(100);
    }
  }, [imagens, loading, gerado]);

  const handleDownloadHTML = useCallback(() => {
    if (!relatorioRef.current) return;

    const diagnosticoHTML = diagnosticos.map((diag, idx) => {
      const imagem = imagens.find((i) => i.id === diag.imagemId);
      const achadosHTML = diag.achados
        .map(
          (a) => `
        <div style="margin-bottom:8px;padding:8px;border:1px solid #e5e7eb;border-radius:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
            <strong>${a.tipo}</strong>
            <span style="background:${a.gravidade === "severo" ? "#fee2e2" : a.gravidade === "moderado" ? "#fed7aa" : "#fef9c3"};padding:2px 8px;border-radius:12px;font-size:11px;">
              ${a.gravidade === "leve" ? "Leve" : a.gravidade === "moderado" ? "Moderado" : "Severo"}
            </span>
          </div>
          <p style="margin:0;font-size:13px;color:#6b7280;">${a.descricao}</p>
          ${a.localizacao ? `<p style="margin:4px 0 0;font-size:11px;color:#9ca3af;">Localizacao: ${a.localizacao}</p>` : ""}
          <div style="margin-top:6px;height:4px;background:#f3f4f6;border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${a.confianca}%;background:${a.confianca > 70 ? "#10b981" : a.confianca > 40 ? "#f59e0b" : "#d1d5db"};border-radius:4px;"></div>
          </div>
          <p style="margin:2px 0 0;font-size:10px;color:#9ca3af;text-align:right;">${a.confianca}% confianca</p>
        </div>`
        )
        .join("");

      const recomendacoesHTML = diag.recomendacoes
        .map((r) => `<li style="font-size:12px;color:#6b7280;margin-bottom:4px;">${r}</li>`)
        .join("");

      return `
      <div style="page-break-inside:avoid;margin-bottom:24px;padding:16px;background:#f9fafb;border-radius:12px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
          <div style="width:48px;height:48px;background:#e5e7eb;border-radius:8px;overflow:hidden;flex-shrink:0;">
            <img src="${diag.imagemId}" alt="" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" />
          </div>
          <div>
            <p style="margin:0;font-weight:600;font-size:14px;">${imagem?.originalName || "Imagem #" + diag.imagemId}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">
              ${imagem?.exame.paciente.nome || ""} - ${imagem?.exame.tipoExame.nome || ""}
            </p>
          </div>
        </div>

        ${diag.diagnosticoPrincipal ? `
        <div style="padding:12px;background:#eff6ff;border:2px solid #bfdbfe;border-radius:8px;margin-bottom:12px;">
          <p style="margin:0;font-weight:700;font-size:16px;color:#2563eb;">${diag.diagnosticoPrincipal}</p>
          <div style="margin-top:6px;display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:6px;background:#dbeafe;border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${diag.confiancaDiagnostico}%;background:#2563eb;border-radius:4px;"></div>
            </div>
            <span style="font-size:12px;font-weight:500;color:#2563eb;">${diag.confiancaDiagnostico}%</span>
          </div>
        </div>
        ` : ""}

        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;font-style:italic;">${diag.resumo}</p>

        ${achadosHTML ? `<h4 style="margin:12px 0 8px;font-size:13px;font-weight:600;">Achados Radiologicos</h4>${achadosHTML}` : ""}

        ${recomendacoesHTML ? `
        <h4 style="margin:12px 0 8px;font-size:13px;font-weight:600;">Recomendacoes</h4>
        <ul style="margin:0;padding-left:16px;">${recomendacoesHTML}</ul>
        ` : ""}

        <div style="margin-top:12px;padding-top:8px;border-top:1px solid #e5e7eb;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:11px;color:#6b7280;">
          <div><strong>Dimensoes:</strong> ${diag.metadados.dimensoes.largura}x${diag.metadados.dimensoes.altura}</div>
          <div><strong>Brilho:</strong> ${diag.metadados.brilhoMedio}%</div>
          <div><strong>Contraste:</strong> ${diag.metadados.contraste}%</div>
          <div><strong>Nitidez:</strong> ${diag.metadados.nitidez}%</div>
        </div>
      </div>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Relatorio de Diagnostico por IA - Imagens</title>
  <style>
    @page { margin: 20mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #111827; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 16px; color: #2563eb; margin: 24px 0 12px; padding-bottom: 4px; border-bottom: 2px solid #2563eb; }
    .header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #2563eb; }
    .header p { margin: 2px 0; font-size: 12px; color: #6b7280; }
    .resumo-card { display: inline-block; padding: 12px 24px; background: #f3f4f6; border-radius: 8px; margin: 4px; text-align: center; }
    .resumo-card strong { display: block; font-size: 24px; color: #111827; }
    .resumo-card span { font-size: 11px; color: #6b7280; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; text-align: center; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relatorio de Diagnostico por Inteligencia Artificial</h1>
    <p>Imagiologia - Gestao</p>
    <p>Gerado em: ${new Date().toLocaleString("pt-PT")}</p>
    <p>Total de imagens analisadas: ${diagnosticos.length}</p>
  </div>

  <div style="text-align:center;margin-bottom:24px;">
    ${(() => {
      const totais = { leve: 0, moderado: 0, severo: 0 };
      diagnosticos.forEach((d) => d.achados.forEach((a) => totais[a.gravidade]++));
      return `
      <div class="resumo-card"><strong>${diagnosticos.length}</strong><span>Imagens Analisadas</span></div>
      <div class="resumo-card"><strong>${totais.severo}</strong><span>Alertas Severos</span></div>
      <div class="resumo-card"><strong>${totais.moderado}</strong><span>Alertas Moderados</span></div>
      <div class="resumo-card"><strong>${totais.leve}</strong><span>Alertas Leves</span></div>
      `;
    })()}
  </div>

  <h2>Diagnosticos por Imagem</h2>
  ${diagnosticoHTML}

  <div class="footer">
    <p>Este relatorio foi gerado automaticamente por sistema de IA assistida.</p>
    <p>O diagnostico definitivo deve ser feito por medico especialista.</p>
    <p>Imagiologia - Gestao &copy; ${new Date().getFullYear()}</p>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-diagnostico-imagens-${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [diagnosticos, imagens]);

  const handleDownloadJSON = useCallback(() => {
    const data = {
      geradoEm: new Date().toISOString(),
      totalImagens: imagens.length,
      totalAnalisadas: diagnosticos.length,
      diagnosticos: diagnosticos.map((d) => ({
        imagemId: d.imagemId,
        modalidade: d.modalidade,
        diagnosticoPrincipal: d.diagnosticoPrincipal,
        confianca: d.confiancaDiagnostico,
        resumo: d.resumo,
        achados: d.achados,
        recomendacoes: d.recomendacoes,
        metadados: d.metadados,
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-diagnostico-imagens-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [diagnosticos, imagens.length]);

  const totalAchados = diagnosticos.reduce((acc, d) => acc + d.achados.length, 0);
  const totalSeveros = diagnosticos.reduce((acc, d) => acc + d.achados.filter((a) => a.gravidade === "severo").length, 0);
  const totalModerados = diagnosticos.reduce((acc, d) => acc + d.achados.filter((a) => a.gravidade === "moderado").length, 0);
  const totalLeves = diagnosticos.reduce((acc, d) => acc + d.achados.filter((a) => a.gravidade === "leve").length, 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-6 py-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Relatorio de Diagnostico por IA</h2>
              </div>
              <div className="flex items-center gap-2">
                {gerado && (
                  <>
                    <button
                      onClick={handleDownloadHTML}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      HTML
                    </button>
                    <button
                      onClick={handleDownloadJSON}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      JSON
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Info */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {imagens.length} imagem(ns) selecionada(s) para analise
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date().toLocaleString("pt-PT")}
                  </p>
                </div>
                {!gerado && !loading && (
                  <button
                    onClick={handleGerarRelatorio}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Stethoscope className="h-4 w-4" />
                    Gerar Relatorio com IA
                  </button>
                )}
              </div>

              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-sm font-medium">A analisar imagens com IA...</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    A processar {imagens.length} imagem(ns) - isto pode demorar alguns segundos
                  </p>
                  <div className="mt-4 h-2 w-64 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progresso}%` }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>
              )}

              {/* Erro */}
              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {erro}
                </div>
              )}

              {/* Resultados */}
              {gerado && !loading && (
                <>
                  {/* Cards Resumo */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="rounded-xl border bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 text-center">
                      <Brain className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p className="text-2xl font-bold text-blue-600">{diagnosticos.length}</p>
                      <p className="text-xs text-blue-600/70">Imagens Analisadas</p>
                    </div>
                    <div className="rounded-xl border bg-gradient-to-br from-red-50 to-red-100/50 p-4 text-center">
                      <AlertTriangle className="h-6 w-6 mx-auto text-red-600 mb-1" />
                      <p className="text-2xl font-bold text-red-600">{totalSeveros}</p>
                      <p className="text-xs text-red-600/70">Alertas Severos</p>
                    </div>
                    <div className="rounded-xl border bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 text-center">
                      <Activity className="h-6 w-6 mx-auto text-orange-600 mb-1" />
                      <p className="text-2xl font-bold text-orange-600">{totalModerados}</p>
                      <p className="text-xs text-orange-600/70">Alertas Moderados</p>
                    </div>
                    <div className="rounded-xl border bg-gradient-to-br from-yellow-50 to-yellow-100/50 p-4 text-center">
                      <BarChart3 className="h-6 w-6 mx-auto text-yellow-600 mb-1" />
                      <p className="text-2xl font-bold text-yellow-600">{totalAchados}</p>
                      <p className="text-xs text-yellow-600/70">Total de Achados</p>
                    </div>
                  </div>

                  {/* Diagnosticos individuais */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-primary" />
                      Diagnosticos por Imagem
                    </h3>
                    {diagnosticos.map((diag, idx) => {
                      const imagem = imagens.find((i) => i.id === diag.imagemId);
                      return (
                        <div
                          key={diag.imagemId}
                          ref={relatorioRef}
                          className="rounded-xl border bg-card overflow-hidden"
                        >
                          {/* Cabecalho da imagem */}
                          <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-3">
                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                              <img
                                src={imagem?.path || ""}
                                alt=""
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = "none";
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{imagem?.originalName || `Imagem #${diag.imagemId}`}</p>
                              <p className="text-xs text-muted-foreground">
                                {imagem?.exame.paciente.nome} - {imagem?.exame.tipoExame.nome} · {imagem ? formatBytes(imagem.tamanho) : ""}
                              </p>
                            </div>
                            {diag.modalidade && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                {diag.modalidade}
                              </span>
                            )}
                          </div>

                          <div className="p-4 space-y-3">
                            {/* Diagnostico Principal */}
                            {diag.diagnosticoPrincipal && (
                              <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-primary">Diagnostico Principal</span>
                                  <span className="text-[10px] text-muted-foreground">{diag.confiancaDiagnostico}% confianca</span>
                                </div>
                                <p className="text-base font-bold text-primary">{diag.diagnosticoPrincipal}</p>
                                <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${diag.confiancaDiagnostico}%` }}
                                    transition={{ duration: 0.6, delay: idx * 0.1 }}
                                    className={cn(
                                      "h-full rounded-full",
                                      diag.confiancaDiagnostico > 70 ? "bg-green-500" :
                                      diag.confiancaDiagnostico > 40 ? "bg-yellow-500" : "bg-muted-foreground/30"
                                    )}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Resumo */}
                            <p className="text-xs text-muted-foreground italic">{diag.resumo}</p>

                            {/* Achados */}
                            {diag.achados.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-xs font-semibold flex items-center gap-1">
                                  <Activity className="h-3 w-3" />
                                  Achados ({diag.achados.length})
                                </h4>
                                {diag.achados.map((achado, i) => (
                                  <div key={i} className="rounded-lg border p-2.5">
                                    <div className="flex items-center justify-between mb-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-medium">{achado.tipo}</span>
                                        <GravidadeBadge gravidade={achado.gravidade} />
                                      </div>
                                      <span className="text-[10px] text-muted-foreground">{achado.confianca}%</span>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">{achado.descricao}</p>
                                    {achado.localizacao && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">Localizacao: {achado.localizacao}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Recomendacoes */}
                            {diag.recomendacoes.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold mb-1">Recomendacoes</h4>
                                <ul className="space-y-0.5">
                                  {diag.recomendacoes.map((r, i) => (
                                    <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/40" />
                                      {r}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Metadados */}
                            <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                              <div className="text-center">
                                <p className="text-[9px] text-muted-foreground">Dimensoes</p>
                                <p className="text-[11px] font-medium">{diag.metadados.dimensoes.largura}x{diag.metadados.dimensoes.altura}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] text-muted-foreground">Brilho</p>
                                <p className="text-[11px] font-medium">{diag.metadados.brilhoMedio}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] text-muted-foreground">Contraste</p>
                                <p className="text-[11px] font-medium">{diag.metadados.contraste}%</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] text-muted-foreground">Nitidez</p>
                                <p className="text-[11px] font-medium">{diag.metadados.nitidez}%</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Disclaimer */}
                  <div className="rounded-lg border bg-muted/30 p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">
                      Esta e uma analise assistida por Inteligencia Artificial. Os resultados sao indicativos e nao substituem
                      a avaliacao clinica de um medico especialista. O diagnostico definitivo deve ser feito por profissional de saude qualificado.
                    </p>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
