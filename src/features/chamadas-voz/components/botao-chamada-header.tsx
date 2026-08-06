"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Loader2, Search, User } from "lucide-react";
import { toast } from "sonner";
import { listarUtilizadores } from "@/features/chat/actions/chat-actions";
import { iniciarChamada } from "../actions/chamada-actions";

interface U {
  id: number;
  nome: string;
  email: string;
  role: string;
}

export function BotaoChamadaHeader() {
  const [aberto, setAberto] = useState(false);
  const [utilizadores, setUtilizadores] = useState<U[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [aChamar, setAChamar] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function fechar(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, []);

  async function abrir() {
    setAberto((v) => !v);
    if (!aberto && utilizadores.length === 0) {
      setLoading(true);
      try {
        const data = await listarUtilizadores();
        setUtilizadores(data as unknown as U[]);
      } catch {
        toast.error("Erro ao carregar utilizadores");
      } finally {
        setLoading(false);
      }
    }
  }

  async function ligar(id: number, nome: string) {
    setAChamar(id);
    try {
      await iniciarChamada({ receptorId: id });
      toast.success(`A ligar para ${nome}...`);
      setAberto(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar chamada";
      toast.error(msg);
    } finally {
      setAChamar(null);
    }
  }

  const filtrados = utilizadores.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={abrir}
        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Chamada de voz"
        title="Chamada de voz"
      >
        <Phone className="h-4 w-4" />
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-72 rounded-xl border bg-card shadow-xl"
          >
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">Chamada de voz</p>
              <p className="text-xs text-muted-foreground">Ligar para um utilizador</p>
            </div>
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar utilizadores..."
                  className="w-full rounded-lg border bg-background py-1.5 pl-8 pr-3 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto py-1">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : filtrados.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <User className="h-6 w-6 text-muted-foreground/40 mb-1" />
                  <p className="text-xs text-muted-foreground">Nenhum utilizador</p>
                </div>
              ) : (
                filtrados.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => ligar(u.id, u.nome)}
                    disabled={aChamar === u.id}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-accent/50 disabled:opacity-50"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10 ring-1 ring-primary/20">
                      <User className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.nome}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {u.email} · {u.role}
                      </p>
                    </div>
                    {aChamar === u.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-green-600" />
                    ) : (
                      <Phone className="h-4 w-4 shrink-0 text-green-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}