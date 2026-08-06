"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Microscope,
  Clock,
  Check,
  FileSignature,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  MessageCircle,
  Printer,
  History,
  BrainCircuit,
  GitCompareArrows,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDate, formatDateTime } from "@/utils/format";
import { Modal } from "@/components/ui/modal";
import { ImageViewer } from "@/components/layout/image-viewer";
import {
  alterarPrioridadeExame,
  assinarLaudo,
  validarAssinaturaLaudo,
  iniciarComunicacaoRadiologista,
} from "@/server/actions/medico-actions";
import type { MedicoSolicitacao, MedicoLaudo } from "@/features/medico/types";
import { ESTADOS_PORTAL, prioridadeColors } from "@/features/medico/constants";

interface Props {
  exame: MedicoSolicitacao;
  laudo: MedicoLaudo | null;
}

const prioridades = ["Normal", "Prioritário", "Urgente", "Emergência"] as const;

export function ExameDetalheClient({ exame, laudo: initialLaudo }: Props) {
  const [laudo, setLaudo] = useState<MedicoLaudo | null>(initialLaudo);
  const [prioridadeModal, setPrioridadeModal] = useState(false);
  const [comunicacaoModal, setComunicacaoModal] = useState(false);
  const [justificacao, setJustificacao] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState<string>(exame.prioridade);
  const [loading, setLoading] = useState(false);
  const [loadingLaudo, setLoadingLaudo] = useState(false);
  const [loadindPrioridade, setLoadindPrioridade] = useState(false);
  const [validador, setValidador] = useState<{ valido: boolean; assinadoEm?: string | null } | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [mensagem, setMensagem] = useState("");

  const imagens = (exame.imagens || []).map((img) => ({
    id: img.id,
    url: img.path,
    name: img.originalName,
  }));

  const estadoIndex = ESTADOS_PORTAL.indexOf(exame.estado as (typeof ESTADOS_PORTAL)[number]);

  async function handleMudarPrioridade() {
    if (!justificacao.trim()) {
      toast.error("A justificação é obrigatória");
      return;
    }
    setLoadindPrioridade(true);
    try {
      await alterarPrioridadeExame(exame.id, { prioridade: novaPrioridade, justificacao });
      toast.success("Prioridade alterada com sucesso");
      setPrioridadeModal(false);
      setJustificacao("");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar prioridade");
    } finally {
      setLoadindPrioridade(false);
    }
  }

  async function handleAssinarLaudo() {
    setLoadingLaudo(true);
    try {
      const atualizado = await assinarLaudo(exame.id);
      setLaudo(atualizado as unknown as MedicoLaudo);
      toast.success("Laudo assinado digitalmente");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao assinar laudo");
    } finally {
      setLoadingLaudo(false);
    }
  }

  async function handleValidarAssinatura() {
    try {
      const res = await validarAssinaturaLaudo(exame.id);
      setValidador(res as { valido: boolean; assinadoEm?: string | null });
    } catch {
      toast.error("Erro ao validar assinatura");
    }
  }

  async function handleEnviarComunicacao() {
    if (!mensagem.trim()) {
      toast.error("Escreva uma mensagem");
      return;
    }
    setLoading(true);
    try {
      await iniciarComunicacaoRadiologista({
        exameId: exame.id,
        radiologistaId: 0,
        mensagem,
      });
      toast.success("Mensagem enviada ao radiologista");
      setComunicacaoModal(false);
      setMensagem("");
    } catch {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setLoading(false);
    }
  }

  function handleImprimirLaudo() {
    window.print();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/medico/acompanhamento" className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Microscope className="h-6 w-6 text-primary" />
              {exame.tipoExame?.nome || "Exame"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {exame.codigo || `#${exame.id}`} · {exame.paciente?.nome}
            </p>
          </div>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-medium", prioridadeColors[exame.prioridade] || "bg-muted")}>
          {exame.prioridade}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Timeline */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Estado da Solicitação
            </h2>
            <div className="flex flex-wrap items-center gap-1">
              {ESTADOS_PORTAL.map((estado, i) => (
                <div key={estado} className="flex items-center">
                  <div className="flex flex-col items-center w-24">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                      i <= estadoIndex ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground"
                    )}>
                      {i < estadoIndex ? <Check className="h-4 w-4" /> : <span className="text-xs font-semibold">{i + 1}</span>}
                    </div>
                    <span className={cn("mt-1.5 text-[10px] text-center leading-tight", i <= estadoIndex ? "text-foreground font-medium" : "text-muted-foreground")}>
                      {estado}
                    </span>
                  </div>
                  {i < ESTADOS_PORTAL.length - 1 && (
                    <div className={cn("h-0.5 w-6 sm:w-8", i < estadoIndex ? "bg-primary" : "bg-muted-foreground/20")} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Dados clínicos */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Dados Clínicos</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Diagnóstico Clínico</dt>
                <dd className="text-sm mt-1">{exame.diagnosticoClinico || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Justificação Clínica</dt>
                <dd className="text-sm mt-1">{exame.justificacaoClinica || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Médico Solicitante</dt>
                <dd className="text-sm mt-1">{exame.medicoSolicitante || "-"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Data de Solicitação</dt>
                <dd className="text-sm mt-1">{formatDateTime(exame.createdAt)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-muted-foreground">Observações</dt>
                <dd className="text-sm mt-1 whitespace-pre-wrap">{exame.observacao || "-"}</dd>
              </div>
            </dl>
          </div>

          {/* Imagens */}
          {imagens.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold mb-4">Imagens do Exame ({imagens.length})</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {imagens.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => { setViewerIndex(idx); setViewerOpen(true); }}
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-muted hover:ring-2 hover:ring-primary/50 transition-all"
                  >
                    <img src={img.url} alt={img.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" loading="lazy" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Laudo */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-primary" />
                Laudo Médico
              </h2>
              {laudo?.assinado && (
                <span className="flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <ShieldCheck className="h-3 w-3" />
                  Assinado
                </span>
              )}
            </div>

            {laudo ? (
              <div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{laudo.conteudo}</div>
                {laudo.assinado && (
                  <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Assinatura Digital</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <ShieldCheck className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{laudo.medicoAssinou?.nome || "Médico"}</p>
                        <p className="text-xs text-muted-foreground">Assinado em {formatDateTime(laudo.assinadoEm)}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button onClick={handleValidarAssinatura} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                        <ShieldCheck className="h-3 w-3" />
                        Validar autenticidade
                      </button>
                      <button onClick={handleImprimirLaudo} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                        <Printer className="h-3 w-3" />
                        Imprimir
                      </button>
                    </div>
                    {validador && (
                      <div className={cn("mt-3 rounded-lg p-3 text-xs", validador.valido ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400")}>
                        {validador.valido ? "✓ Assinatura digital válida" : "✗ Assinatura inválida"}
                        {validador.assinadoEm && <p className="mt-1 text-muted-foreground">Assinado em {formatDateTime(validador.assinadoEm)}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
                <FileSignature className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">Nenhum laudo disponível para este exame.</p>
                <p className="text-xs mt-1">O laudo será disponibilizado após o exame ser realizado.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold mb-4">Ações</h2>
            <div className="space-y-2">
              <button onClick={() => setPrioridadeModal(true)} className="flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                Alterar Prioridade
              </button>
              <button onClick={() => setComunicacaoModal(true)} className="flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
                <MessageCircle className="h-4 w-4 text-primary" />
                Comunicar com Radiologista
              </button>
{laudo && !laudo.assinado && (
                <button onClick={handleAssinarLaudo} disabled={loadingLaudo} className="flex w-full items-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                  {loadingLaudo ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
                  {loadingLaudo ? "A assinar..." : "Assinar Laudo"}
                </button>
              )}
              <Link href={`/medico/exames/${exame.id}/diagnostico`} className="flex w-full items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors">
                <BrainCircuit className="h-4 w-4" />
                Diagnóstico IA
              </Link>
              <Link href={`/medico/comparar?exameId=${exame.id}`} className="flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
                <GitCompareArrows className="h-4 w-4 text-indigo-600" />
                Comparar Exames
              </Link>
              <Link href={`/medico/pacientes/${exame.paciente?.id}`} className="flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium hover:bg-accent transition-colors">
                <History className="h-4 w-4 text-purple-600" />
                Histórico do Paciente
              </Link>
            </div>
          </div>

          {exame.historico && exame.historico.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Histórico de Eventos
              </h2>
              <div className="space-y-3">
                {exame.historico.map((h) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Clock className="h-3 w-3 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{formatDateTime(h.createdAt)}</p>
                      <p className="text-sm">{h.descricao || h.acao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Prioridade */}
      <Modal open={prioridadeModal} onClose={() => setPrioridadeModal(false)} title="Alterar Prioridade" description="A justificação é obrigatória para alterar a prioridade">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nova Prioridade</label>
            <select value={novaPrioridade} onChange={(e) => setNovaPrioridade(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30">
              {prioridades.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Justificação *</label>
            <textarea value={justificacao} onChange={(e) => setJustificacao(e.target.value)} rows={4} placeholder="Justifique a alteração de prioridade..." className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setPrioridadeModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleMudarPrioridade} disabled={loadindPrioridade} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loadindPrioridade && <Loader2 className="h-4 w-4 animate-spin" />}
              {loadindPrioridade ? "A guardar..." : "Confirmar"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Comunicação */}
      <Modal open={comunicacaoModal} onClose={() => setComunicacaoModal(false)} title="Comunicar com Radiologista" description="Envie observações ou solicite revisão">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mensagem</label>
            <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={4} placeholder="Escreva a sua mensagem ao radiologista..." className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setComunicacaoModal(false)} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
            <button onClick={handleEnviarComunicacao} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              {loading ? "A enviar..." : "Enviar"}
            </button>
          </div>
        </div>
      </Modal>

      {viewerOpen && imagens.length > 0 && (
        <ImageViewer images={imagens} initialIndex={viewerIndex} open={viewerOpen} onClose={() => setViewerOpen(false)} />
      )}
    </motion.div>
  );
}
