"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Loader2,
  User,
  Plus,
} from "lucide-react";
import {
  listarChamadas,
  iniciarChamada,
} from "@/features/chamadas-voz/actions/chamada-actions";
import type { HistoricochamadaItem } from "@/features/chamadas-voz/types";

type Aba = "todas" | "perdidas" | "feitas" | "recebidas";

const abas: { chave: Aba; label: string }[] = [
  { chave: "todas", label: "Todas" },
  { chave: "perdidas", label: "Perdidas" },
  { chave: "feitas", label: "Feitas" },
  { chave: "recebidas", label: "Recebidas" },
];

export function HistoricoChamadasClient() {
  const [chamadas, setChamadas] = useState<HistoricochamadaItem[]>([]);
  const [aba, setAba] = useState<Aba>("todas");
  const [loading, setLoading] = useState(true);
  const [aChamarId, setAChamarId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    try {
      const data = await listarChamadas();
      setChamadas(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error(`Erro ao carregar chamadas: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void carregar();
    }, 0);
    return () => clearTimeout(t);
  }, [carregar]);

  // Polling para manter o histórico atualizado
  useEffect(() => {
    const intervalo = setInterval(() => {
      void carregar();
    }, 15000);
    return () => clearInterval(intervalo);
  }, [carregar]);

  const filtradas = useMemo(() => {
    if (aba === "perdidas")
      return chamadas.filter((c) => c.direcao === "PERDIDA");
    if (aba === "feitas") return chamadas.filter((c) => c.direcao === "FEITA");
    if (aba === "recebidas")
      return chamadas.filter((c) => c.direcao === "RECEBIDA");
    return chamadas;
  }, [chamadas, aba]);

  async function ligarDeVolta(id: number) {
    if (aChamarId) return;
    setAChamarId(id);
    try {
      await iniciarChamada({ receptorId: id });
      toast.success("A ligar...");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao ligar";
      toast.error(message);
    } finally {
      setAChamarId(null);
    }
  }

  function iconeDirecao(d: HistoricochamadaItem["direcao"]) {
    if (d === "PERDIDA") return PhoneMissed;
    if (d === "FEITA") return PhoneOutgoing;
    return PhoneIncoming;
  }

  function corDirecao(d: HistoricochamadaItem["direcao"]) {
    if (d === "PERDIDA") return "text-destructive";
    if (d === "FEITA") return "text-green-500";
    return "text-primary";
  }

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
            <Phone className="h-6 w-6 text-primary" />
            Chamadas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Histórico de chamadas de voz — estilo WhatsApp
          </p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 border-b">
        {abas.map((a) => {
          const ativo = aba === a.chave;
          const count =
            a.chave === "todas"
              ? chamadas.length
              : a.chave === "perdidas"
                ? chamadas.filter((c) => c.direcao === "PERDIDA").length
                : a.chave === "feitas"
                  ? chamadas.filter((c) => c.direcao === "FEITA").length
                  : chamadas.filter((c) => c.direcao === "RECEBIDA").length;
          return (
            <button
              key={a.chave}
              onClick={() => setAba(a.chave)}
              className={cn(
                "relative -mb-px flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors",
                ativo
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {a.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  ativo
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
              {ativo && (
                <motion.div
                  layoutId="aba-chamadas"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Lista de chamadas */}
      <div className="rounded-xl border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <Phone className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Sem chamadas</p>
            <p className="text-xs mt-1">
              As suas chamadas de voz aparecerão aqui.
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            <div className="divide-y">
              {filtradas.map((c, i) => {
                const DirecaoIcon = iconeDirecao(c.direcao);
                const cor = corDirecao(c.direcao);
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full",
                          c.direcao === "PERDIDA"
                            ? "bg-destructive/10"
                            : c.direcao === "FEITA"
                              ? "bg-green-500/10"
                              : "bg-primary/10"
                        )}
                      >
                        <User className={cn("h-5 w-5", cor)} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {c.outroNome}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <DirecaoIcon className={cn("h-3 w-3", cor)} />
                        <span>
                          {c.direcao === "PERDIDA"
                            ? "Chamada perdida"
                            : c.direcao === "FEITA"
                              ? "Chamada feita"
                              : "Chamada recebida"}
                          {c.duracaoSeg > 0 && ` · ${c.duracaoSeg}s`}
                        </span>
                      </p>
                    </div>

                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatDateTime(c.iniciadoEm)}
                    </span>

                    <button
                      onClick={() => ligarDeVolta(c.outroUtilizadorId)}
                      disabled={aChamarId !== null}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-600 hover:bg-green-500/25 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label={`Ligar para ${c.outroNome}`}
                      title="Ligar de volta"
                    >
                      {aChamarId === c.outroUtilizadorId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}

