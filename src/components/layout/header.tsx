"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
  Menu,
  Settings,
  HelpCircle,
  ChevronDown,
  CheckCheck,
  Loader2,
  StickyNote,
  MessageCircle,
  Send,
  Users,
  X,
  FileText,
  Stethoscope,
  Building2,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LembretesRapidos } from "@/features/anotacoes/components/lembretes-rapidos";

interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  createdAt: string;
  paciente?: { id: number; nome: string } | null;
}

interface ConversaPreview {
  id: number;
  titulo: string | null;
  tituloDisplay: string;
  ultimaMensagem: {
    id: number;
    conteudo: string;
    createdAt: string;
    utilizador: { id: number; nome: string } | null;
  } | null;
  naoLidas: number;
  participantes: { utilizador: { id: number; nome: string; ultimoVisto: string | null } }[];
}

interface ResultadoPesquisa {
  pacientes: { id: number; nome: string; numeroProcesso: string | null }[];
  exames: {
    id: number;
    codigo: string | null;
    estado: string;
    paciente: { id: number; nome: string } | null;
    tipoExame: { nome: string } | null;
  }[];
  tecnicos: { id: number; nome: string; especialidade: string | null }[];
  procedencias: { id: number; nome: string }[];
  tiposExame: { id: number; nome: string; modalidade: string | null }[];
}

const vazio: ResultadoPesquisa = {
  pacientes: [],
  exames: [],
  tecnicos: [],
  procedencias: [],
  tiposExame: [],
};

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [lembretesOpen, setLembretesOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [chatNaoLidas, setChatNaoLidas] = useState(0);
  const [conversas, setConversas] = useState<ConversaPreview[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const lembretesRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global search state
  const [searchTerm, setSearchTerm] = useState("");
  const [resultados, setResultados] = useState<ResultadoPesquisa>(vazio);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (lembretesRef.current && !lembretesRef.current.contains(event.target as Node)) {
        setLembretesOpen(false);
      }
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setChatOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ⌘K / Ctrl+K shortcut to focus search
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Debounced search
  const executarPesquisa = useCallback(async (termo: string) => {
    const q = termo.trim();
    if (q.length < 2) {
      setResultados(vazio);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/pesquisa?q=${encodeURIComponent(q)}`);
      if (response.ok) {
        const data = await response.json();
        setResultados(data.resultados || vazio);
      }
    } catch {
      // Silently fail
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setSearchOpen(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      executarPesquisa(value);
    }, 300);
  };

  const limparPesquisa = () => {
    setSearchTerm("");
    setResultados(vazio);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchInputRef.current?.focus();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    if (q.length < 2) return;
    setSearchOpen(false);
    router.push(`/pacientes?search=${encodeURIComponent(q)}`);
  };

  const totalResultados =
    resultados.pacientes.length +
    resultados.exames.length +
    resultados.tecnicos.length +
    resultados.procedencias.length +
    resultados.tiposExame.length;

  // Load notifications
  async function carregarNotificacoes() {
    setLoadingNotif(true);
    try {
      const response = await fetch("/api/notificacoes");
      if (response.ok) {
        const data = await response.json();
        setNotificacoes(data.notificacoes || []);
        setNaoLidas(data.naoLidas || 0);
      }
    } catch {
      console.error("Erro ao carregar notificações");
    } finally {
      setLoadingNotif(false);
    }
  }

  // Load chat unread count
  async function carregarChatNaoLidas() {
    try {
      const response = await fetch("/api/chat");
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.totalNaoLidas === "number") {
          setChatNaoLidas(data.totalNaoLidas);
        }
      }
    } catch {
      // Silently fail
    }
  }

  // Load conversations for the dropdown
  async function carregarConversas() {
    setLoadingChat(true);
    try {
      const response = await fetch("/api/chat/conversas");
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.conversas)) {
          setConversas(data.conversas);
        }
      }
    } catch {
      // Silently fail
    } finally {
      setLoadingChat(false);
    }
  }

  // Heartbeat: update ultimoVisto every 2 minutes
  useEffect(() => {
    const heartbeat = () => {
      fetch("/api/chat/heartbeat", { method: "POST" }).catch(() => {});
    };
    heartbeat();
    const interval = setInterval(heartbeat, 120000);
    return () => clearInterval(interval);
  }, []);

  // Load notifications and poll every 30 seconds
  useEffect(() => {
    carregarNotificacoes();
    carregarChatNaoLidas();
    const interval = setInterval(() => {
      carregarNotificacoes();
      carregarChatNaoLidas();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Refresh when opening dropdown
  const prevOpen = useRef(notificationsOpen);
  useEffect(() => {
    if (!prevOpen.current && notificationsOpen) {
      carregarNotificacoes();
    }
    prevOpen.current = notificationsOpen;
  }, [notificationsOpen]);

  // Load conversations when opening chat dropdown
  const prevChatOpen = useRef(chatOpen);
  useEffect(() => {
    if (!prevChatOpen.current && chatOpen) {
      carregarConversas();
    }
    prevChatOpen.current = chatOpen;
  }, [chatOpen]);

  async function marcarComoLida(id: number) {
    try {
      await fetch("/api/notificacoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "marcar_lida", id }),
      });
      setNotificacoes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, lida: true } : n))
      );
      setNaoLidas((prev) => Math.max(0, prev - 1));
    } catch {
      console.error("Erro ao marcar notificação como lida");
    }
  }

  async function marcarTodasComoLidas() {
    try {
      await fetch("/api/notificacoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "marcar_todas" }),
      });
      setNotificacoes((prev) =>
        prev.map((n) => ({ ...n, lida: true }))
      );
      setNaoLidas(0);
    } catch {
      console.error("Erro ao marcar todas como lidas");
    }
  }

  function formatarTempo(data: string): string {
    try {
      return formatDistanceToNow(new Date(data), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return "há pouco";
    }
  }

function isOnline(ultimoVisto: string | null): boolean {
    if (!ultimoVisto) return false;
    try {
      const diff = Date.now() - new Date(ultimoVisto).getTime();
      return diff < 5 * 60 * 1000; // 5 minutes
    } catch {
      return false;
    }
  }

  async function handleSignOut() {
    setProfileOpen(false);
    try {
      await signOut({ redirect: false, redirectTo: "/login" });
    } catch {
      // Ignora erros, continua com a navegação
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      {/* Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground lg:hidden transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo Mobile */}
      <div className="flex items-center gap-2 lg:hidden">
        <Image
          src="/logo.svg"
          alt="Logo Imagiologia"
          width={32}
          height={32}
          className="rounded-lg"
          priority
        />
      </div>

      {/* Search Bar */}
      <div className="hidden sm:flex flex-1 max-w-md" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="group relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            placeholder="Pesquisar pacientes, exames..."
            className="w-full rounded-lg border border-input bg-muted/50 py-2 pl-10 pr-10 text-sm transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
            aria-label="Pesquisa global"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={limparPesquisa}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Limpar pesquisa"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60 md:inline-flex">
              ⌘K
            </kbd>
          )}

          <AnimatePresence>
            {searchOpen && searchTerm.trim().length >= 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 top-full mt-2 max-h-96 overflow-y-auto rounded-xl border bg-card shadow-xl"
              >
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : totalResultados === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
<Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum resultado para "{searchTerm}"
                    </p>
                  </div>
                ) : (
                  <div className="py-1">
                    {resultados.pacientes.length > 0 && (
                      <div>
                        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                          Pacientes
                        </p>
                        {resultados.pacientes.map((p) => (
                          <Link
                            key={`p-${p.id}`}
                            href={`/pacientes/${p.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent/50"
                          >
                            <Users className="h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{p.nome}</p>
                              {p.numeroProcesso && (
                                <p className="truncate text-xs text-muted-foreground">
                                  Processo: {p.numeroProcesso}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {resultados.exames.length > 0 && (
                      <div>
                        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                          Exames
                        </p>
                        {resultados.exames.map((e) => (
                          <Link
                            key={`e-${e.id}`}
                            href={`/exames/${e.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent/50"
                          >
                            <FileText className="h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">
                                {e.tipoExame?.nome || e.codigo || `Exame #${e.id}`}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {e.paciente?.nome}
                                {e.codigo ? ` · ${e.codigo}` : ""}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                              {e.estado}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {resultados.tecnicos.length > 0 && (
                      <div>
                        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                          Técnicos
                        </p>
                        {resultados.tecnicos.map((t) => (
                          <Link
                            key={`t-${t.id}`}
                            href="/tecnicos"
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent/50"
                          >
                            <Stethoscope className="h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{t.nome}</p>
                              {t.especialidade && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {t.especialidade}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    {resultados.procedencias.length > 0 && (
                      <div>
                        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                          Procedências
                        </p>
                        {resultados.procedencias.map((pr) => (
                          <Link
                            key={`pr-${pr.id}`}
                            href="/procedencias"
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent/50"
                          >
                            <Building2 className="h-4 w-4 shrink-0 text-primary" />
                            <p className="truncate font-medium">{pr.nome}</p>
                          </Link>
                        ))}
                      </div>
                    )}

                    {resultados.tiposExame.length > 0 && (
                      <div>
                        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
                          Tipos de Exame
                        </p>
                        {resultados.tiposExame.map((te) => (
                          <Link
                            key={`te-${te.id}`}
                            href="/tipos-exame"
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 px-3 py-2 text-sm transition-colors hover:bg-accent/50"
                          >
                            <ClipboardList className="h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium">{te.nome}</p>
                              {te.modalidade && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {te.modalidade}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="mt-1 w-full border-t px-3 py-2.5 text-left text-xs font-medium text-primary hover:bg-accent/50 transition-colors"
                    >
Ver todos os resultados para "{searchTerm}"
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label={darkMode ? "Modo claro" : "Modo escuro"}
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Chat - Messenger Dropdown */}
        <div ref={chatRef} className="relative">
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Chat"
            title="Chat"
          >
            <MessageCircle className="h-4 w-4" />
            {chatNaoLidas > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {chatNaoLidas > 9 ? "9+" : chatNaoLidas}
              </span>
            )}
          </button>

          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-card shadow-xl"
              >
                <div className="border-b px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Mensagens</p>
                  <Link
                    href="/chat"
                    onClick={() => setChatOpen(false)}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Ver todas
                  </Link>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loadingChat ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : conversas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <MessageCircle className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhuma conversa</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        Inicie uma nova conversa
                      </p>
                    </div>
                  ) : (
                    conversas.map((conv) => (
                      <Link
                        key={conv.id}
                        href={`/chat`}
                        onClick={() => setChatOpen(false)}
                        className={cn(
                          "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50 border-b border-border/50 last:border-b-0",
                          conv.naoLidas > 0 && "bg-primary/[0.02]"
                        )}
                      >
                        {/* Avatar with online indicator */}
                        <div className="relative shrink-0">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          {conv.participantes.some(p => isOnline(p.utilizador.ultimoVisto)) && (
                            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
                              <span className="absolute h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                              <span className="h-2.5 w-2.5 rounded-full bg-green-500 ring-1 ring-white" />
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={cn(
                              "text-sm truncate",
                              conv.naoLidas > 0 ? "font-semibold" : "font-medium"
                            )}>
                              {conv.tituloDisplay}
                            </p>
                            {conv.naoLidas > 0 && (
                              <span className="shrink-0 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[9px] font-bold text-primary-foreground">
                                {conv.naoLidas}
                              </span>
                            )}
                          </div>
                          {conv.ultimaMensagem && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              <span className="font-medium">{conv.ultimaMensagem.utilizador?.nome?.split(" ")[0] || "Alguém"}: </span>
                              {conv.ultimaMensagem.conteudo}
                            </p>
                          )}
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                            {conv.ultimaMensagem
                              ? formatarTempo(conv.ultimaMensagem.createdAt)
                              : "Sem mensagens"}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
                <div className="border-t px-4 py-2.5">
                  <Link
                    href="/chat"
                    onClick={() => setChatOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Send className="h-3 w-3" />
                    Nova mensagem
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Lembretes / Anotações Rápidas */}
        <div ref={lembretesRef} className="relative">
          <button
            onClick={() => setLembretesOpen(!lembretesOpen)}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Lembretes"
            title="Lembretes"
          >
            <StickyNote className="h-4 w-4" />
          </button>
          <LembretesRapidos open={lembretesOpen} onClose={() => setLembretesOpen(false)} />
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
            {naoLidas > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {naoLidas}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-80 rounded-xl border bg-card shadow-xl"
              >
                <div className="border-b px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Notificações</p>
                  {naoLidas > 0 && (
                    <button
                      onClick={marcarTodasComoLidas}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Marcar todas como lidas
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {loadingNotif ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : notificacoes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                      <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                    </div>
                  ) : (
                    notificacoes.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => marcarComoLida(notif.id)}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-colors hover:bg-accent/50",
                          !notif.lida && "bg-primary/[0.02]"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            !notif.lida ? "bg-primary" : "bg-transparent"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm truncate",
                              !notif.lida ? "font-semibold" : "font-medium text-muted-foreground"
                            )}>
                              {notif.titulo}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{notif.mensagem}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                              {formatarTempo(notif.createdAt)}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t px-4 py-2.5">
                  <button className="w-full text-center text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    Ver todas as notificações
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
            aria-label="Perfil do utilizador"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-2 ring-primary/20">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium leading-tight">{session?.user?.name || "Utilizador"}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{session?.user?.role || "Administrador"}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 md:block" />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-card shadow-xl"
              >
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-medium">{session?.user?.name || "Utilizador"}</p>
                  <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                </div>
                <div className="p-1.5">
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Configurações
                  </button>
                  <button
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Ajuda
                  </button>
                </div>
                <div className="border-t p-1.5">
<button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Terminar sessão
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
