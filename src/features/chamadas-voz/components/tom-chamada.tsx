"use client";

import { useEffect, useRef } from "react";

interface Props {
  ativo: boolean;
  loop?: boolean;
  volume?: number;
}

export function TomChamada({ ativo, loop = false, volume = 0.15 }: Props) {
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!ativo) return;

    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    const ctx = ctxRef.current;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 440;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    oscRef.current = osc;
    gainRef.current = gain;

    if (loop) {
      gain.gain.value = 0;
      timerRef.current = setInterval(() => {
        if (!gainRef.current || !ctxRef.current) return;
        const t = ctxRef.current.currentTime;
        gainRef.current.gain.cancelScheduledValues(t);
        gainRef.current.gain.setValueAtTime(volume, t);
        gainRef.current.gain.exponentialRampToValueAtTime(0.001, t + 1);
      }, 3000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        osc.stop();
      } catch {}
      oscRef.current = null;
      gainRef.current = null;
    };
  }, [ativo, loop, volume]);

  return null;
}