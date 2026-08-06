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

const ESTADOS_TERMINADAS = ["TERMINADA", "REJEITADA", "CANCELADA", "NAO_ATENDIDA"];

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

  // Manter referência da chamada ativa em curso
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

  // -------------------------------------------------------------------------
  // Sincronização UNIFICADA (lógica estilo WhatsApp/Messenger)
  //
  // Uma única função decide o estado da chamada, garantindo invariantes:
  //   - Chamada RECEBIDA (A_CHAMAR em que sou o receptor):
  //       -> apenas `chamadaEntrada` definido; `chamadaAtiva`=null; `emCurso`=false
  //   - Chamada que INICIEI (A_CHAMAR como chamador) ou EM_CURSO:
  //       -> apenas `chamadaAtiva` definido; `emCurso`=true; `chamadaEntrada`=null
  // Nunca os dois ao mesmo tempo, evitando sobreposição de modais.
  // -------------------------------------------------------------------------
  const sincronizarEstado = useCallback(async () => {
    if (!currentUserId) return;

    try {
      // 1. Chamada ativa (A_CHAMAR ou EM_CURSO) onde participo
      const ativa = await obterChamadaAtiva();

      // 2. Sem chamada ativa -> limpar tudo e verificar chamadas recebidas
      if (!ativa) {
        if (chamadaEmCursoRef.current || chamadaAtivaRef.current) {
          finalizarPeer();
        }
        chamadaEmCursoRef.current = false;
        setEmCurso(false);
        setChamadaAtiva(null);
        chamadaAtivaRef.current = null;

        const pendentes = await obterChamadasPendentes();
        setChamadaEntrada(pendentes[0] || null);
        return;
      }

      // 3. Chamada TERMINADA remotamente
      if (ESTADOS_TERMINADAS.includes(ativa.estado)) {
        if (chamadaEmCursoRef.current || chamadaAtivaRef.current) {
          finalizarPeer();
        }
        chamadaEmCursoRef.current = false;
        setEmCurso(false);
        setChamadaAtiva(null);
        chamadaAtivaRef.current = null;
        setChamadaEntrada(null);
        return;
      }

      // 4. SOU O RECEPTOR de uma chamada A_CHAMAR -> modal de recebida
      if (ativa.estado === "A_CHAMAR" && ativa.receptorId === currentUserId) {
        // Limpar qualquer estado de chamada ativa residual
        if (chamadaEmCursoRef.current || chamadaAtivaRef.current) {
          finalizarPeer();
        }
        chamadaEmCursoRef.current = false;
        setEmCurso(false);
        setChamadaAtiva(null);
        chamadaAtivaRef.current = null;
        setChamadaEntrada(ativa);
        return;
      }

      // 5. SOU O CHAMADOR de uma A_CHAMAR, OU a chamada está EM_CURSO
      const souChamador = ativa.estado === "A_CHAMAR" && ativa.chamadorId === currentUserId;
      if (souChamador || ativa.estado === "EM_CURSO") {
        // Garantir que o modal de recebida está fechado
        setChamadaEntrada(null);

        if (!chamadaEmCursoRef.current) {
          chamadaEmCursoRef.current = true;
          setEmCurso(true);
          const peer = await configurarPeer(true);

          // Se sou chamador, criar e enviar a offer
          if (souChamador) {
            ultimoSinalIdRef.current = 0;
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

        // Processar sinais WebRTC quando a chamada está em curso
        if (ativa.estado === "EM_CURSO" && chamadaEmCursoRef.current) {
          await processarSinais(ativa);
        }
      }
    } catch {
      // Silencioso
    }
  }, [currentUserId, configurarPeer, processarSinais, finalizarPeer]);

// Polling único e unificado
  useEffect(() => {
    if (!currentUserId) return;

    // Primeira verificação (adiada para evitar setState síncrono no effect)
    const primeiro = setTimeout(() => {
      void sincronizarEstado();
    }, 0);

    const intervalo = setInterval(() => {
      void sincronizarEstado();
    }, 3000);

    return () => {
      clearTimeout(primeiro);
      clearInterval(intervalo);
    };
  }, [currentUserId, sincronizarEstado]);

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

      setChamadaEntrada(null);
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
    chamadaAtivaRef.current = null;
    chamadaEmCursoRef.current = false;
  }, [chamadaAtiva, finalizarPeer]);

  const cancelar = useCallback(async () => {
    if (!chamadaAtiva) return;
    await cancelarChamada(chamadaAtiva.id).catch(() => {});
    finalizarPeer();
    setChamadaAtiva(null);
    chamadaAtivaRef.current = null;
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
