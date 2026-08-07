"use client";

import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Mic, MicOff, User, Volume2, VolumeX } from "lucide-react";
import { useState, useEffect } from "react";
import { useChamadaVoz } from "../hooks/use-chamada-voz";
import { TomChamada } from "./tom-chamada";

export function GestorChamadas() {
  const { data: session } = useSession();
  const currentUserId = Number(session?.user?.id) || 0;
  const chamada = useChamadaVoz({ currentUserId });
  const [duracao, setDuracao] = useState(0);

  useEffect(() => {
    if (!chamada.emCurso || !chamada.chamadaAtiva) return;
    const inicio = chamada.chamadaAtiva.aceiteEm
      ? new Date(chamada.chamadaAtiva.aceiteEm).getTime()
      : Date.now();
    const intervalo = setInterval(() => {
      setDuracao(Math.floor((Date.now() - inicio) / 1000));
    }, 1000);
    return () => clearInterval(intervalo);
  }, [chamada.emCurso, chamada.chamadaAtiva]);

  const formatarDuracao = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const chamadaEntrada = chamada.chamadaEntrada;
  const chamadaAtiva = chamada.chamadaAtiva;

  // Determina se devemos mostrar o modal de "chamada recebida".
  // Ocorre quando o utilizador é o RECEPTOR de uma chamada A_CHAMAR.
  const mostrarChamadaRecebida =
    !!chamadaEntrada &&
    chamadaEntrada.receptorId === currentUserId &&
    chamadaEntrada.estado === "A_CHAMAR";

  // Determina se devemos mostrar o modal de "chamada ativa".
  // Apenas quando está realmente em curso e NÃO há chamada recebida a mostrar.
  const mostrarChamadaAtiva =
    !!chamadaAtiva &&
    chamada.emCurso &&
    !mostrarChamadaRecebida;

  // Nome a apresentar
  const nomeChamada = mostrarChamadaRecebida
    ? chamadaEntrada.chamador.nome
    : mostrarChamadaAtiva
      ? chamadaAtiva.chamadorId === currentUserId
        ? chamadaAtiva.receptor.nome
        : chamadaAtiva.chamador.nome
      : "";

  const status = mostrarChamadaAtiva && chamadaAtiva?.estado === "A_CHAMAR"
    ? "A chamar..."
    : formatarDuracao(duracao);

  return (
    <>
      {/* Tom de chamada recebida */}
      <TomChamada ativo={mostrarChamadaRecebida} loop volume={0.1} />
      {/* Tom de chamada ativa a chamar (chamador) */}
      <TomChamada
        ativo={
          mostrarChamadaAtiva &&
          !!chamadaAtiva &&
          chamadaAtiva.estado === "A_CHAMAR"
        }
        loop
        volume={0.06}
      />

      {mostrarChamadaRecebida ? (
        /* ------------------------------------------------------------------
           MODAL DE CHAMADA RECEBIDA (botões Aceitar / Rejeitar)
           Estilo WhatsApp: ecrã a pedir permissão de áudio e aceitar a chamada
        ------------------------------------------------------------------ */
        <AnimatePresence>
          <motion.div
            key="chamada-recebida"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-2xl border bg-card p-8 text-center shadow-2xl"
            >
              <div className="relative mx-auto mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-4 ring-primary/20">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-card" />
              </div>
              <h2 className="text-xl font-bold">{nomeChamada}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Chamada de voz de {chamadaEntrada.chamador.role}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1 animate-pulse">
                A convidá-lo para uma chamada...
              </p>
              <div className="mt-8 flex items-center justify-center gap-6">
                <button
                  onClick={() => chamada.recusar()}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/90 hover:scale-105 transition-transform"
                  aria-label="Rejeitar"
                  title="Rejeitar chamada"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
                <button
                  onClick={() => chamada.aceitar()}
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 hover:scale-105 transition-transform"
                  aria-label="Atender"
                  title="Atender chamada"
                >
                  <Phone className="h-6 w-6" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ) : mostrarChamadaAtiva ? (
        /* ------------------------------------------------------------------
           MODAL DE CHAMADA ATIVA (botões Microfone / Terminar)
        ------------------------------------------------------------------ */
        <AnimatePresence>
          <motion.div
            key="chamada-ativa"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-sm rounded-2xl border bg-card p-8 text-center shadow-2xl"
            >
              <div className="relative mx-auto mb-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-4 ring-primary/20">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 ring-2 ring-card" />
              </div>
              <h2 className="text-xl font-bold">{nomeChamada}</h2>
              <p className="text-sm text-muted-foreground mt-1">{status}</p>
              <div className="mt-8 flex items-center justify-center gap-6">
                <button
                  onClick={() => chamada.alternarAltifalante()}
                  className={`flex h-14 w-14 items-center justify-center rounded-full hover:scale-105 transition-transform ${
                    chamada.altoFalante
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                  aria-label={chamada.altoFalante ? "Desativar altifalante" : "Ativar altifalante"}
                  title={chamada.altoFalante ? "Desativar altifalante" : "Ativar altifalante"}
                >
                  {chamada.altoFalante ? (
                    <Volume2 className="h-6 w-6" />
                  ) : (
                    <VolumeX className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={() => chamada.alternarMicrofone()}
                  className={`flex h-14 w-14 items-center justify-center rounded-full hover:scale-105 transition-transform ${
                    chamada.microfoneMudo
                      ? "bg-amber-500 text-white hover:bg-amber-600"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                  aria-label={chamada.microfoneMudo ? "Ativar microfone" : "Desativar microfone"}
                  title={chamada.microfoneMudo ? "Ativar microfone" : "Desativar microfone"}
                >
                  {chamada.microfoneMudo ? (
                    <MicOff className="h-6 w-6" />
                  ) : (
                    <Mic className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={() =>
                    chamadaAtiva?.estado === "A_CHAMAR"
                      ? chamada.cancelar()
                      : chamada.terminar()
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-white hover:bg-destructive/90 hover:scale-105 transition-transform"
                  aria-label="Terminar"
                  title="Terminar chamada"
                >
                  <PhoneOff className="h-6 w-6" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      ) : null}
    </>
  );
}
