"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, Loader2, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";

interface Mensagem {
  id: string;
  role: "user" | "assistente";
  conteudo: string;
  timestamp: Date;
}

const SUGESTOES = [
  "Quantos pacientes estão registados?",
  "Quais são os exames recentes?",
  "Há exames solicitados pendentes?",
  "Quais são os tipos de exame disponíveis?",
  "Como funciona o sistema?",
];

export function AssistenteFlutuante() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [aPensar, setAPensar] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const alternarAberto = () => {
    const novoEstado = !aberto;
    setAberto(novoEstado);
    // Mensagem de boas-vindas quando abre pela primeira vez
    if (novoEstado && mensagens.length === 0) {
      setMensagens([
        {
          id: "bem-vindo",
          role: "assistente",
          conteudo:
            "Olá! 👋 Sou o assistente do Sistema de Gestão de Imagiologia.\n\nPosso ajudar com pacientes, exames, técnicos, turnos, relatórios e muito mais. O que deseja saber?",
          timestamp: new Date(),
        },
      ]);
    }
  };

  // Auto-scroll para o fim
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, aPensar]);

  // Focar input quando abre
  useEffect(() => {
    if (aberto) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [aberto]);

  const enviar = useCallback(
    async (texto?: string) => {
      const pergunta = (texto ?? input).trim();
      if (!pergunta || aPensar) return;

      setInput("");
      setMensagens((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", conteudo: pergunta, timestamp: new Date() },
      ]);
      setAPensar(true);

      try {
        const res = await fetch("/api/assistente", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pergunta }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Erro ao contactar o assistente");
        }

        const data = await res.json();
        setMensagens((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistente",
            conteudo: data.resposta || "Desculpe, não consegui processar a sua pergunta.",
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro desconhecido";
        setMensagens((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistente",
            conteudo: `Desculpe, ocorreu um erro: ${message}. Tente novamente.`,
            timestamp: new Date(),
          },
        ]);
      } finally {
        setAPensar(false);
      }
    },
    [input, aPensar]
  );

  const limparConversa = () => {
    setMensagens([]);
  };

  return (
    <>
      {/* Botão flutuante */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", damping: 20, stiffness: 260 }}
        onClick={alternarAberto}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:scale-105 transition-all"
        aria-label={aberto ? "Fechar assistente" : "Abrir assistente"}
      >
        <AnimatePresence mode="wait">
          {aberto ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="bot"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Bot className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Janela do assistente */}
      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-50 flex h-[560px] max-h-[calc(100vh-120px)] w-[380px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-black/20"
          >
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 border-b bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-primary-foreground">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Assistente do Sistema</p>
                <p className="text-[10px] text-primary-foreground/80 truncate">
                  Gestão de Imagiologia · IA
                </p>
              </div>
              <button
                onClick={limparConversa}
                className="rounded-lg p-1.5 text-primary-foreground/80 hover:bg-white/20 hover:text-primary-foreground transition-colors"
                aria-label="Limpar conversa"
                title="Limpar conversa"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto bg-muted/20 p-4 space-y-3">
              {mensagens.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm whitespace-pre-wrap break-words",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border rounded-bl-sm"
                    )}
                  >
                    {m.role === "assistente" && (
                      <div className="mb-1 flex items-center gap-1.5">
                        <Bot className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-semibold text-primary">Assistente</span>
                      </div>
                    )}
                    <p>{m.conteudo}</p>
                    <p
                      className={cn(
                        "mt-1 text-[9px]",
                        m.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {m.timestamp.toLocaleTimeString("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}

              {aPensar && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border bg-card px-4 py-3 shadow-sm">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">A pensar...</span>
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Sugestões rápidas */}
            {mensagens.length <= 1 && !aPensar && (
              <div className="border-t bg-card px-3 py-2">
                <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
                  Sugestões rápidas:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGESTOES.map((s) => (
                    <button
                      key={s}
                      onClick={() => enviar(s)}
                      className="rounded-full border bg-background px-2.5 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t bg-card p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      enviar();
                    }
                  }}
                  placeholder="Escreva a sua pergunta..."
                  rows={1}
                  className="flex-1 resize-none rounded-lg border bg-background px-3 py-2.5 text-sm max-h-32 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <button
                  onClick={() => enviar()}
                  disabled={aPensar || !input.trim()}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  aria-label="Enviar mensagem"
                >
                  {aPensar ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}