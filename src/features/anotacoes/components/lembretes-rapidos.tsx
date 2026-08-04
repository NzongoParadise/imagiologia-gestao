"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  StickyNote,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/utils/cn";
import {
  criarAnotacao,
  listarAnotacoes,
  removerAnotacao,
  atualizarAnotacao,
} from "@/features/anotacoes/actions/anotacoes-actions";

interface Anotacao {
  id: number;
  conteudo: string;
  tipo: string;
  entidade: string | null;
  entidadeId: number | null;
  exameId: number | null;
  pacienteId: number | null;
  createdAt: string;
  updatedAt: string;
  utilizador: { id: number; nome: string } | null;
}

interface LembretesRapidosProps {
  open: boolean;
  onClose: () => void;
}

export function LembretesRapidos({ open, onClose }: LembretesRapidosProps) {
  const { data: session } = useSession();
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaAnotacao, setNovaAnotacao] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoTexto, setEditandoTexto] = useState("");
  const [removendoId, setRemovendoId] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const carregarAnotacoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarAnotacoes({
        utilizadorId: Number(session?.user?.id),
        tipo: "lembrete",
        limit: 20,
      });
      setAnotacoes(data as unknown as Anotacao[]);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (open) {
      carregarAnotacoes();
      // Focus input when opened
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, carregarAnotacoes]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const handleAdicionar = async () => {
    if (!novaAnotacao.trim()) return;
    setAdicionando(true);
    try {
      const anotacao = await criarAnotacao({
        conteudo: novaAnotacao.trim(),
        tipo: "lembrete",
      });
      setAnotacoes((prev) => [anotacao as unknown as Anotacao, ...prev]);
      setNovaAnotacao("");
      toast.success("Lembrete adicionado");
    } catch {
      toast.error("Erro ao adicionar lembrete");
    } finally {
      setAdicionando(false);
    }
  };

  const handleRemover = async (id: number) => {
    setRemovendoId(id);
    try {
      await removerAnotacao(id);
      setAnotacoes((prev) => prev.filter((a) => a.id !== id));
      toast.success("Lembrete removido");
    } catch {
      toast.error("Erro ao remover lembrete");
    } finally {
      setRemovendoId(null);
    }
  };

  const handleEditar = async (id: number) => {
    if (!editandoTexto.trim()) return;
    try {
      const updated = await atualizarAnotacao(id, editandoTexto.trim());
      setAnotacoes((prev) =>
        prev.map((a) => (a.id === id ? (updated as unknown as Anotacao) : a))
      );
      setEditandoId(null);
      setEditandoTexto("");
      toast.success("Lembrete atualizado");
    } catch {
      toast.error("Erro ao editar lembrete");
    }
  };

  const formatarTempo = (data: string) => {
    try {
      return formatDistanceToNow(new Date(data), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return "há pouco";
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.95, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -4 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-card shadow-xl"
        >
          {/* Header */}
          <div className="border-b px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">Meus Lembretes</p>
              </div>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {anotacoes.length}
              </span>
            </div>
          </div>

          {/* Add new */}
          <div className="px-4 py-3 border-b">
            <textarea
              ref={inputRef}
              value={novaAnotacao}
              onChange={(e) => setNovaAnotacao(e.target.value)}
              placeholder="Escreva um lembrete rápido..."
              rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleAdicionar();
                }
              }}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleAdicionar}
                disabled={adicionando || !novaAnotacao.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {adicionando ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                {adicionando ? "A adicionar..." : "Adicionar"}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : anotacoes.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <AlertCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum lembrete</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Adicione lembretes pessoais rápidos
                </p>
              </div>
            ) : (
              <div className="divide-y">
                <AnimatePresence initial={false}>
                  {anotacoes.map((anotacao) => (
                    <motion.div
                      key={anotacao.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="group relative px-4 py-3 hover:bg-accent/30 transition-colors"
                    >
                      {editandoId === anotacao.id ? (
                        /* Edit mode */
                        <div>
                          <textarea
                            value={editandoTexto}
                            onChange={(e) => setEditandoTexto(e.target.value)}
                            rows={2}
                            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => {
                                setEditandoId(null);
                                setEditandoTexto("");
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs hover:bg-accent transition-colors"
                            >
                              <X className="h-3 w-3" />
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleEditar(anotacao.id)}
                              disabled={!editandoTexto.trim()}
                              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              <Check className="h-3 w-3" />
                              Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* View mode */
                        <div>
                          <p className="text-sm whitespace-pre-wrap pr-14">
                            {anotacao.conteudo}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">
                              {formatarTempo(anotacao.createdAt)}
                            </span>
                          </div>
                          {/* Actions */}
                          <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditandoId(anotacao.id);
                                setEditandoTexto(anotacao.conteudo);
                              }}
                              className="rounded p-1 text-muted-foreground hover:bg-accent transition-colors"
                              title="Editar"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleRemover(anotacao.id)}
                              disabled={removendoId === anotacao.id}
                              className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                              title="Remover"
                            >
                              {removendoId === anotacao.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t px-4 py-2.5">
            <p className="text-[10px] text-muted-foreground text-center">
              Enter para adicionar · Shift+Enter para nova linha
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
