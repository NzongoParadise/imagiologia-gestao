"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ChamadaDTO } from "../types";
import {
  iniciarChamada,
  aceitarChamada,
  rejeitarChamada,
  terminarChamada,
  cancelarChamada,
  obterChamadaAtiva,
  obterChamadasPendentes,
  enviarSinalVoip,
  obterSinaisVoip,
} from "../actions/chamada-actions";

interface UseChamadaVozOptions {
  currentUserId: number;
}

interface UseChamadaVozReturn {
  chamadaAtiva: ChamadaDTO | null;
  chamadaEntrada: ChamadaDTO | null;
  emCurso: boolean;
  iniciar: (receptorId: number, conversaId?: number) => Promise<void>;
  aceitar: () => Promise<void>;
  recusar: () => Promise<void>;
  terminar: () => Promise<void>;
  cancelar: () => Promise<void>;
  microfoneMudo: boolean;
  alternarMicrofone: () => void;
  alertaSonoroRef: React.RefObject<HTMLAudioElement | null>;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useChamadaVoz({
  currentUserId,
}: UseChamadaVozOptions): UseChamadaVozReturn {
  const [chamadaAtiva, setChamadaAtiva] = useState<ChamadaDTO | null>(null);
  const [chamadaEntrada, setChamadaEntrada] = useState<ChamadaDTO | null>(null);
  const [emCurso, setEmCurso] = useState(false);
  const [microfoneMudo, setMicrofoneMudo] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ultimoSinalIdRef = useRef(0);
  const chamadaEmCursoRef = useRef(false);
  const chamadaAtivaRef = useRef<ChamadaDTO | null>(null);
  const alertaSonoroRef = useRef<HTMLAudioElement | null>(null);

  // Manter referência da chamada ativa
  useEffect(() => {
    chamadaAtivaRef.current = chamadaAtiva;
  }, [chamadaAtiva]);

  const finalizarPeer = useCallback(() => {
    // Parar streams
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;

    // Fechar peer connection
    if (peerRef.current) {
      peerRef.current.onicecandidate = null;
      peerRef.current.ontrack = null;
      peerRef.current.onconnectionstatechange = null;
      peerRef.current.close();
      peerRef.current = null;
    }

    // Limpar audio element
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current.remove();
      audioRef.current = null;
    }

    chamadaEmCursoRef.current = false;
    setEmCurso(false);
  }, []);

  // Limpar recursos ao desmontar
  useEffect(() => {
    return () => {
      finalizarPeer();
    };
  }, [finalizarPeer]);

  // Obter stream de áudio do microfone
  const obterMicrofone = useCallback(async (): Promise<MediaStream> => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Navegador nao suporta captura de audio");
    }
    return navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });
  }, []);

  // Configurar peer connection local
  const configurarPeer = useCallback(
    async (comOuvinte: boolean): Promise<RTCPeerConnection> => {
      const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

      // Obter microfone e adicionar tracks
      if (!streamRef.current) {
        streamRef.current = await obterMicrofone();
      }
      streamRef.current.getAudioTracks().forEach((track) => {
        peer.addTrack(track, streamRef.current!);
      });

      if (comOuvinte) {
        // Elemento de áudio para ouvir o outro participante
        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.style.display = "none";
        document.body.appendChild(audioEl);
        audioRef.current = audioEl;

        peer.ontrack = (event) => {
          if (audioRef.current && event.streams[0]) {
            audioRef.current.srcObject = event.streams[0];
          }
        };
      }

      peer.onicecandidate = (event) => {
        if (event.candidate && chamadaAtivaRef.current) {
          void enviarSinalVoip({
            chamadaId: chamadaAtivaRef.current.id,
            tipo: "ice",
            conteudo: JSON.stringify(event.candidate),
          }).catch(() => {});
        }
      };

      peer.onconnectionstatechange = () => {
        if (
          peer.connectionState === "failed" ||
          peer.connectionState === "closed"
        ) {
          if (chamadaAtivaRef.current) {
            void terminarChamada(chamadaAtivaRef.current.id).catch(() => {});
          }
          finalizarPeer();
          setChamadaAtiva(null);
        }
      };

      peerRef.current = peer;
      return peer;
    },
    [obterMicrofone, finalizarPeer]
  );

  // Processar sinais recebidos
  const processarSinais = useCallback(async (chamada: ChamadaDTO) => {
    const sinais = await obterSinaisVoip(chamada.id, ultimoSinalIdRef.current);
    for (const sinal of sinais) {
      ultimoSinalIdRef.current = Math.max(ultimoSinalIdRef.current, sinal.id);

      const peer = peerRef.current;
      if (!peer) continue;

      if (sinal.tipo === "offer") {
        const desc = JSON.parse(sinal.conteudo) as RTCSessionDescriptionInit;
        await peer.setRemoteDescription(desc);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await enviarSinalVoip({
          chamadaId: chamada.id,
          tipo: "answer",
          conteudo: JSON.stringify(peer.localDescription),
        });
      } else if (sinal.tipo === "answer") {
        const desc = JSON.parse(sinal.conteudo) as RTCSessionDescriptionInit;
        await peer.setRemoteDescription(desc);
      } else if (sinal.tipo === "ice") {
        const candidate = JSON.parse(sinal.conteudo) as RTCIceCandidateInit;
        await peer.addIceCandidate(candidate).catch(() => {});
      }
    }
  }, []);

  // Polling de chamadas pendentes (chamadas recebidas)
  useEffect(() => {
    if (!currentUserId) return;

    let intervalo: ReturnType<typeof setInterval> | null = null;

    const verificarChamadas = async () => {
      if (chamadaEmCursoRef.current) return;

      try {
        const pendentes = await obterChamadasPendentes();
        if (pendentes.length > 0) {
          setChamadaEntrada(pendentes[0]);
        } else {
          setChamadaEntrada((prev) => (prev ? null : prev));
        }
      } catch {
        // Silencioso
      }
    };

    verificarChamadas();
    intervalo = setInterval(verificarChamadas, 5000);
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [currentUserId]);

  // Polling de estado da chamada quando existe chamada ativa
  useEffect(() => {
    if (!currentUserId) return;

    let intervalo: ReturnType<typeof setInterval> | null = null;

    const verificarEstado = async () => {
      try {
        const ativa = await obterChamadaAtiva();

        if (!ativa) {
          // Chamada terminou remotamente
          if (chamadaAtivaRef.current) {
            finalizarPeer();
            setChamadaAtiva(null);
            chamadaEmCursoRef.current = false;
          }
          return;
        }

// A chamada só deve ser gerida como "ativa em curso" quando o utilizador
        // é o CHAMADOR de uma chamada A_CHAMAR, ou quando a chamada já está EM_CURSO.
        // Chamadas A_CHAMAR destinadas ao RECEPTOR devem manter o modal de chamada
        // recebida (com botão Aceitar), e não o modal de chamada ativa (com Terminar).
        const gerirComoAtiva =
          ativa.estado === "EM_CURSO" ||
          (ativa.estado === "A_CHAMAR" && ativa.chamadorId === currentUserId);

        if (gerirComoAtiva && !chamadaEmCursoRef.current && !emCurso) {
          chamadaEmCursoRef.current = true;
          setEmCurso(true);
          const peer = await configurarPeer(true);

          // Se fui o chamador, criar offer
          if (ativa.chamadorId === currentUserId) {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            await enviarSinalVoip({
              chamadaId: ativa.id,
              tipo: "offer",
              conteudo: JSON.stringify(peer.localDescription),
            });
          }

          setChamadaAtiva(ativa);
          chamadaAtivaRef.current = ativa;
        }

        // Processar sinais
        if (ativa.estado === "EM_CURSO" && chamadaEmCursoRef.current) {
          await processarSinais(ativa);
        }

        // Chamada terminou
        const terminou = ["TERMINADA", "REJEITADA", "CANCELADA", "NAO_ATENDIDA"];
        if (terminou.includes(ativa.estado) && chamadaEmCursoRef.current) {
          finalizarPeer();
          setChamadaAtiva(null);
          chamadaEmCursoRef.current = false;
        }
      } catch {
        // Silencioso
      }
    };

    verificarEstado();
    intervalo = setInterval(verificarEstado, 3000);
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [currentUserId, configurarPeer, processarSinais, finalizarPeer, emCurso]);

  const iniciar = useCallback(
    async (receptorId: number, conversaId?: number) => {
      if (chamadaEmCursoRef.current) {
        throw new Error("Ja esta numa chamada");
      }

      const chamada = await iniciarChamada({
        receptorId,
        conversaId,
      });

      // Reset da sinalização para a nova chamada
      ultimoSinalIdRef.current = 0;

      setChamadaAtiva(chamada);
      chamadaAtivaRef.current = chamada;
      chamadaEmCursoRef.current = true;
      setEmCurso(true);

      // Configurar peer como chamador
      const peer = await configurarPeer(true);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await enviarSinalVoip({
        chamadaId: chamada.id,
        tipo: "offer",
        conteudo: JSON.stringify(peer.localDescription),
      });
    },
    [configurarPeer]
  );

  const aceitar = useCallback(async () => {
    if (!chamadaEntrada) return;

    const chamada = await aceitarChamada(chamadaEntrada.id);
    setChamadaEntrada(null);
    setChamadaAtiva(chamada);
    chamadaAtivaRef.current = chamada;
    chamadaEmCursoRef.current = true;
    setEmCurso(true);

    // Reset da sinalização para a nova chamada
    ultimoSinalIdRef.current = 0;

    // Configurar peer como receptor (sem criar offer, aguardar a do chamador)
    await configurarPeer(true);
  }, [chamadaEntrada, configurarPeer]);

  const recusar = useCallback(async () => {
    if (!chamadaEntrada) return;
    await rejeitarChamada(chamadaEntrada.id);
    setChamadaEntrada(null);
  }, [chamadaEntrada]);

  const terminar = useCallback(async () => {
    if (!chamadaAtiva) return;
    await terminarChamada(chamadaAtiva.id).catch(() => {});
    finalizarPeer();
    setChamadaAtiva(null);
    chamadaEmCursoRef.current = false;
  }, [chamadaAtiva, finalizarPeer]);

  const cancelar = useCallback(async () => {
    if (!chamadaAtiva) return;
    await cancelarChamada(chamadaAtiva.id).catch(() => {});
    finalizarPeer();
    setChamadaAtiva(null);
    chamadaEmCursoRef.current = false;
  }, [chamadaAtiva, finalizarPeer]);

  const alternarMicrofone = useCallback(() => {
    setMicrofoneMudo((prev) => {
      const novoEstado = !prev;
      streamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = !novoEstado;
      });
      return novoEstado;
    });
  }, []);

  return {
    chamadaAtiva,
    chamadaEntrada,
    emCurso,
    iniciar,
    aceitar,
    recusar,
    terminar,
    cancelar,
    microfoneMudo,
    alternarMicrofone,
    alertaSonoroRef,
  };
}