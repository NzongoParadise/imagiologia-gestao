"use client";

import { useState, useEffect, useCallback } from "react";
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
  User,
  Clock,
  Loader2,
} from "lucide-react";
import { formatDateTime } from "@/utils/format";
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

interface AnotacoesExameProps {
  exameId: number;
  pacienteId?: number;
}

export function AnotacoesExame({ exameId, pacienteId }: AnotacoesExameProps) {
  const { data: session } = useSession();
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaAnotacao, setNovaAnotacao] = useState("");
  const [adicionando, setAdicionando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editandoTexto, setEditandoTexto] = useState("");
  const [removendoId, setRemovendoId] = useState<number | null>(null);

  const carregarAnotacoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listarAnotacoes({ exameId });
      setAnotacoes(data as unknown as Anotacao[]);
    } catch {
      toast.error("Erro ao carregar anotacoes");
    } finally {
      setLoading(false);
    }
  }, [exameId]);

  useEffect(() => {
    carregarAnotacoes();
  }, [carregarAnotacoes]);

  const handleAdicionar = async () => {
    if (!novaAnotacao.trim()) return;
    setAdicionando(true);
    try {
      const anotacao = await criarAnotacao({
        conteudo: novaAnotacao.trim(),
        tipo: "exame",
        exameId,
        pacienteId,
      });
      setAnotacoes((prev) => [anotacao as unknown as Anotacao, ...prev]);
      setNovaAnotacao("");
      toast.success("Anotacao adicionada");
    } catch {
      toast.error("Erro ao adicionar anotacao");
    } finally {
      setAdicionando(false);
    }
  };

  const handleRemover = async (id: number) => {
    setRemovendoId(id);
    try {
      await removerAnotacao(id);
      setAnotacoes((prev) => prev.filter((a) => a.id !== id));
      toast.success("Anotacao removida");
    } catch {
      toast.error("Erro ao remover anotacao");
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
      toast.success("Anotacao atualizada");
    } catch {
      toast.error("Erro ao editar anotacao");
    }
  };

  const iniciarEdicao = (anotacao: Anotacao) => {
    setEditandoId(anotacao.id);
    setEditandoTexto(anotacao.conteudo);
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditandoTexto("");
  };

  const isOwner = (anotacao: Anotacao) => {
    return anotacao.utilizador?.id === Number(session?.user?.id);
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Anotacoes</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {anotacoes.length}
          </span>
        </div>
      </div>

      {/* Nova anotacao */}
      <div className="mb-4">
        <textarea
          value={novaAnotacao}
          onChange={(e) => setNovaAnotacao(e.target.value)}
          placeholder="Escreva uma anotacao sobre este exame..."
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

      {/* Lista de anotacoes */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : anotacoes.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <StickyNote className="h-8 w-8 mb-2" />
          <p className="text-sm">Nenhuma anotacao ainda</p>
          <p className="text-xs mt-1">
            Adicione notas sobre o exame, observacoes ou lembretes
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {anotacoes.map((anotacao) => (
              <motion.div
                key={anotacao.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="group rounded-lg border p-3 hover:bg-muted/30 transition-colors"
              >
                {editandoId === anotacao.id ? (
                  /* Modo edicao */
                  <div>
                    <textarea
                      value={editandoTexto}
                      onChange={(e) => setEditandoTexto(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={cancelarEdicao}
                        className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs hover:bg-accent transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Cancelar
                      </button>
                      <button
                        onClick={() => handleEditar(anotacao.id)}
                        disabled={!editandoTexto.trim()}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        <Check className="h-3 w-3" />
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Modo visualizacao */
                  <div>
                    <p className="text-sm whitespace-pre-wrap">
                      {anotacao.conteudo}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {anotacao.utilizador?.nome || "Desconhecido"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDateTime(anotacao.createdAt)}
                        </span>
                      </div>
                      {isOwner(anotacao) && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => iniciarEdicao(anotacao)}
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
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

