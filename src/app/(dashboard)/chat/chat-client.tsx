"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import { Modal } from "@/components/ui/modal";
import {
  MessageCircle,
  Send,
  Plus,
  Search,
  Loader2,
  Users,
  CheckCheck,
  ChevronLeft,
} from "lucide-react";
import {
  listarConversas,
  criarConversa,
  obterMensagens,
  enviarMensagem,
  marcarConversaLida,
} from "@/features/chat/actions/chat-actions";
import { BotaoChamada } from "@/features/chamadas-voz/components/botao-chamada";

interface Utilizador {
  id: number;
  nome: string;
  email: string;
  role: string;
}

interface Mensagem {
  id: number;
  conversaId: number;
  utilizadorId: number;
  conteudo: string;
  createdAt: string;
  utilizador: { id: number; nome: string; role: string } | null;
}

interface Participante {
  id: number;
  conversaId: number;
  utilizadorId: number;
  lidaEm: string | null;
  utilizador: Utilizador;
}

interface Conversa {
  id: number;
  titulo: string | null;
  criadaPorId: number | null;
  createdAt: string;
  updatedAt: string;
  tituloDisplay: string;
  participantes: Participante[];
  ultimaMensagem: Mensagem | null;
  naoLidas: number;
}

interface ChatClientProps {
  utilizadores: Utilizador[];
}

export function ChatClient({ utilizadores }: ChatClientProps) {
  const { data: session } = useSession();
  const currentUserId = Number(session?.user?.id);

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<number | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMensagens, setLoadingMensagens] = useState(false);
  const [search, setSearch] = useState("");
  const [novaMsg, setNovaMsg] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Novo chat modal
  const [modalAberto, setModalAberto] = useState(false);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [tituloNovo, setTituloNovo] = useState("");
  const [criando, setCriando] = useState(false);

  const [mobileConverAberta, setMobileConverAberta] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

const carregarConversas = useCallback(async () => {
    try {
      const data = await listarConversas();
      setConversas(data as unknown as Conversa[]);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("Erro ao carregar conversas:", message, err);
      toast.error(`Erro ao carregar conversas: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await carregarConversas();
    })();
  }, [carregarConversas]);

  // Polling de novas conversas/mensagens a cada 15s
  useEffect(() => {
    const interval = setInterval(carregarConversas, 15000);
    return () => clearInterval(interval);
  }, [carregarConversas]);

  const carregarMensagens = useCallback(async (conversaId: number) => {
    setLoadingMensagens(true);
    try {
      const data = await obterMensagens(conversaId);
      setMensagens(data as unknown as Mensagem[]);
    } catch {
      toast.error("Erro ao carregar mensagens");
    } finally {
      setLoadingMensagens(false);
    }
  }, []);

  useEffect(() => {
    if (conversaAtiva) {
      void (async () => {
        setMobileConverAberta(true);
        await carregarMensagens(conversaAtiva);
        await marcarConversaLida(conversaAtiva).catch(() => {});
      })();
    }
  }, [conversaAtiva, carregarMensagens]);

  // Polling de mensagens da conversa ativa
  useEffect(() => {
    if (!conversaAtiva) return;
    const interval = setInterval(() => {
      carregarMensagens(conversaAtiva);
      marcarConversaLida(conversaAtiva).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, [conversaAtiva, carregarMensagens]);

  // Auto scroll para o fim
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, loadingMensagens, conversaAtiva]);

  const conversasFiltradas = useMemo(() => {
    if (!search.trim()) return conversas;
    const q = search.toLowerCase();
    return conversas.filter(
      (c) =>
        c.tituloDisplay.toLowerCase().includes(q) ||
        c.ultimaMensagem?.conteudo.toLowerCase().includes(q)
    );
  }, [conversas, search]);

  const totalNaoLidas = useMemo(
    () => conversas.reduce((acc, c) => acc + c.naoLidas, 0),
    [conversas]
  );

  const conversaSelecionada = conversas.find((c) => c.id === conversaAtiva);

  async function handleEnviar() {
    if (!novaMsg.trim() || !conversaAtiva || enviando) return;
    setEnviando(true);
    try {
      const mensagem = await enviarMensagem(conversaAtiva, novaMsg.trim());
      setMensagens((prev) => [...prev, mensagem as unknown as Mensagem]);
      setNovaMsg("");
      carregarConversas();
    } catch {
      toast.error("Erro ao enviar mensagem");
    } finally {
      setEnviando(false);
    }
  }

  function toggleSelecionado(id: number) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleCriarConversa() {
    if (selecionados.length === 0) {
      toast.error("Selecione pelo menos um participante");
      return;
    }
    setCriando(true);
    try {
      const conversa = await criarConversa({
        titulo: tituloNovo.trim() || undefined,
        participanteIds: selecionados,
      });
      setModalAberto(false);
      setSelecionados([]);
      setTituloNovo("");
      setConversaAtiva(conversa.id);
      await carregarConversas();
      toast.success("Conversa criada");
    } catch {
      toast.error("Erro ao criar conversa");
    } finally {
      setCriando(false);
    }
  }

  const participantesNomes = (c: Conversa) =>
    c.participantes
      .filter((p) => p.utilizadorId !== currentUserId)
      .map((p) => p.utilizador.nome);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            Chat
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comunicação interna da equipa
            {totalNaoLidas > 0 && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                {totalNaoLidas} não lida(s)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Conversa
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr] h-[calc(100vh-220px)] min-h-[480px]">
        {/* Lista de conversas */}
        <div
          className={cn(
            "rounded-xl border bg-card flex flex-col overflow-hidden",
            mobileConverAberta && "hidden lg:flex"
          )}
        >
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar conversas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : conversasFiltradas.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center text-muted-foreground px-4">
                <MessageCircle className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm font-medium">Nenhuma conversa</p>
                <p className="text-xs mt-1">
                  Inicie uma nova conversa com a sua equipa.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {conversasFiltradas.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setConversaAtiva(c.id)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors hover:bg-accent/50",
                      conversaAtiva === c.id && "bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {c.tituloDisplay}
                          </p>
                          {c.ultimaMensagem && (
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {formatDateTime(c.ultimaMensagem.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs text-muted-foreground truncate">
                            {c.ultimaMensagem
                              ? `${c.ultimaMensagem.utilizador?.nome || ""}: ${c.ultimaMensagem.conteudo}`
                              : participantesNomes(c).join(", ") || "Sem mensagens"}
                          </p>
                          {c.naoLidas > 0 && (
                            <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                              {c.naoLidas}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Janela de conversa */}
        <div
          className={cn(
            "rounded-xl border bg-card flex flex-col overflow-hidden",
            !mobileConverAberta && "hidden lg:flex"
          )}
        >
          {conversaAtiva && conversaSelecionada ? (
            <>
              {/* Cabeçalho */}
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <button
                  onClick={() => setMobileConverAberta(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent lg:hidden"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {conversaSelecionada.tituloDisplay}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {participantesNomes(conversaSelecionada).join(", ")}
                  </p>
                </div>
                {conversaSelecionada.ultimaMensagem && (
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <CheckCheck className="h-3 w-3 text-primary" />
                    {mensagens.length} msg
                  </span>
                )}
                {participantesNomes(conversaSelecionada).length === 1 && (
                  <BotaoChamada
                    receptorId={
                      conversaSelecionada.participantes.find(
                        (p) => p.utilizadorId !== currentUserId
                      )?.utilizadorId || 0
                    }
                    conversaId={conversaSelecionada.id}
                    tamanho="sm"
                  />
                )}
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
                {loadingMensagens ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : mensagens.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
                    <MessageCircle className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm font-medium">Sem mensagens</p>
                    <p className="text-xs mt-1">
                      Envie a primeira mensagem desta conversa.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {mensagens.map((m) => {
                      const minha = m.utilizadorId === currentUserId;
                      return (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "flex",
                            minha ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                              minha
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-card border rounded-bl-sm"
                            )}
                          >
                            {!minha && (
                              <p className="text-[10px] font-semibold text-primary mb-0.5">
                                {m.utilizador?.nome || "Desconhecido"}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap break-words">
                              {m.conteudo}
                            </p>
                            <p
                              className={cn(
                                "text-[9px] mt-1",
                                minha
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground"
                              )}
                            >
                              {formatDateTime(m.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="border-t p-3">
                <div className="flex items-end gap-2">
                  <textarea
                    value={novaMsg}
                    onChange={(e) => setNovaMsg(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleEnviar();
                      }
                    }}
                    placeholder="Escreva uma mensagem..."
                    rows={1}
                    className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm resize-none max-h-32 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                  <button
                    onClick={handleEnviar}
                    disabled={enviando || !novaMsg.trim()}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    aria-label="Enviar mensagem"
                  >
                    {enviando ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">
                  Enter para enviar · Shift+Enter para nova linha
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground p-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <MessageCircle className="h-8 w-8 text-primary" />
              </div>
              <p className="text-base font-semibold text-foreground">
                Bem-vindo ao Chat
              </p>
              <p className="text-sm mt-1 max-w-sm">
                Selecione uma conversa à esquerda ou crie uma nova conversa
                para comunicar com a equipa.
              </p>
              <button
                onClick={() => setModalAberto(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nova Conversa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Conversa */}
      <Modal
        open={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setSelecionados([]);
          setTituloNovo("");
        }}
        title="Nova Conversa"
        description="Selecione os utilizadores para iniciar uma conversa"
        size="lg"
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Título (opcional)</label>
            <input
              type="text"
              value={tituloNovo}
              onChange={(e) => setTituloNovo(e.target.value)}
              placeholder="Ex.: Equipa de Radiologia"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Participantes * ({selecionados.length} selecionado(s))
            </label>
            <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
              {utilizadores
                .filter((u) => u.id !== currentUserId)
                .map((u) => {
                  const ativo = selecionados.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleSelecionado(u.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/50",
                        ativo && "bg-primary/5"
                      )}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email} · {u.role}
                        </p>
                      </div>
                      <div
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                          ativo
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {ativo && <CheckCheck className="h-3 w-3" />}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t">
            <button
              onClick={() => {
                setModalAberto(false);
                setSelecionados([]);
                setTituloNovo("");
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCriarConversa}
              disabled={criando || selecionados.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {criando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {criando ? "A criar..." : "Criar Conversa"}
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

