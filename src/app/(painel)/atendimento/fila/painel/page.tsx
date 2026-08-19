"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface Consultorio {
  numero: string;
  nome: string;
  andar: string | null;
  bloco: string | null;
}

interface ChamadaItem {
  id: number;
  tipoFila: "CONSULTA" | "URGENCIA";
  senha: string;
  paciente: string;
  numeroProcesso: string | null;
  especialidade: string;
  consultorio: Consultorio | null;
  prioridade: string;
  chamadoEm: string;
  secsAtras: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function anunciarVoz(nome: string, senha: string, consultorio?: string | null) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const destino = consultorio ? `, dirija-se ao ${consultorio}` : ", dirija-se ao balcão de atendimento";
  const texto = `Atenção! Paciente ${nome}, senha ${senha}${destino}, por favor.`;
  const utterance = new SpeechSynthesisUtterance(texto);
  utterance.lang = "pt-PT";
  utterance.rate = 0.85;
  utterance.pitch = 1.1;
  window.speechSynthesis.speak(utterance);
}

function formatarHora(iso: string) {
  return new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(iso));
}

function formatarData() {
  return new Intl.DateTimeFormat("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

// ─── Componente Principal ───────────────────────────────────────────────────

export default function PainelFilaPage() {
  const [chamados, setChamados] = useState<ChamadaItem[]>([]);
  const [chamadaAtiva, setChamadaAtiva] = useState<ChamadaItem | null>(null);
  const [mostrarFlash, setMostrarFlash] = useState(false);
  const [relogio, setRelogio] = useState("");
  const [data, setData] = useState("");
  const [tempoEspera, setTempoEspera] = useState(0);
  const seenIds = useRef<Set<number>>(new Set());
  const flashTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Relógio em tempo real
  useEffect(() => {
    const tick = () => {
      setRelogio(new Intl.DateTimeFormat("pt-PT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date()));
      setData(formatarData());
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Contador de espera da chamada ativa
  useEffect(() => {
    if (!chamadaAtiva) return;
    const base = new Date(chamadaAtiva.chamadoEm).getTime();
    const id = setInterval(() => {
      setTempoEspera(Math.round((Date.now() - base) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [chamadaAtiva]);

  const dispararFlash = useCallback((item: ChamadaItem) => {
    setChamadaAtiva(item);
    setMostrarFlash(true);
    setTempoEspera(item.secsAtras);
    anunciarVoz(item.paciente, item.senha, item.consultorio?.numero ?? item.consultorio?.nome);
    if (flashTimeout.current) clearTimeout(flashTimeout.current);
    flashTimeout.current = setTimeout(() => setMostrarFlash(false), 8000);
  }, []);

  // Polling a cada 5 segundos
  const fetchPainel = useCallback(async () => {
    try {
      const res = await fetch("/api/fila/painel", { cache: "no-store" });
      if (!res.ok) return;
      const dados: ChamadaItem[] = await res.json();
      if (!Array.isArray(dados)) return;
      setChamados(dados);

      const novo = dados.find((d) => !seenIds.current.has(d.id));
      if (novo) {
        seenIds.current.add(novo.id);
        dispararFlash(novo);
      } else if (dados.length > 0 && !chamadaAtiva) {
        const primeiro = dados[0];
        seenIds.current.add(primeiro.id);
        setChamadaAtiva(primeiro);
        setTempoEspera(primeiro.secsAtras);
      }
    } catch {
      // silent
    }
  }, [chamadaAtiva, dispararFlash]);

  useEffect(() => {
    fetchPainel();
    const id = setInterval(fetchPainel, 5000);
    return () => clearInterval(id);
  }, [fetchPainel]);

  const corPrioridade = (p: string) => {
    if (p === "Urgente") return "#ef4444";
    if (p === "Prioridade") return "#f97316";
    return "#22c55e";
  };

  const corTipo = (t: string) => (t === "URGENCIA" ? "#ef4444" : "#3b82f6");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 50%, #0a1628 100%)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Segoe UI', 'Inter', sans-serif",
        color: "#fff",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ── Grade animada de fundo ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }}
      />

      {/* ── Flash de chamada (overlay) ── */}
      {mostrarFlash && chamadaAtiva && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.92)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 500,
              height: 500,
              borderRadius: "50%",
              border: `4px solid ${corTipo(chamadaAtiva.tipoFila)}`,
              opacity: 0.2,
              animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 10,
              background: "linear-gradient(145deg, #0f1e35, #162944)",
              border: `3px solid ${corTipo(chamadaAtiva.tipoFila)}`,
              borderRadius: 24,
              padding: "48px 64px",
              textAlign: "center",
              maxWidth: 680,
              width: "90vw",
              boxShadow: `0 0 80px ${corTipo(chamadaAtiva.tipoFila)}55, 0 0 20px rgba(0,0,0,0.8)`,
            }}
          >
            <div
              style={{
                display: "inline-block",
                background: `${corTipo(chamadaAtiva.tipoFila)}22`,
                border: `1px solid ${corTipo(chamadaAtiva.tipoFila)}`,
                borderRadius: 999,
                padding: "6px 20px",
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: 3,
                color: corTipo(chamadaAtiva.tipoFila),
                marginBottom: 28,
                textTransform: "uppercase",
              }}
            >
              {chamadaAtiva.tipoFila === "URGENCIA" ? "🚨 Urgência" : "📋 Consulta"}
            </div>

            <div
              style={{
                fontSize: "clamp(80px, 18vw, 140px)",
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: -4,
                color: "#fff",
                textShadow: `0 0 60px ${corTipo(chamadaAtiva.tipoFila)}`,
                marginBottom: 8,
                animation: "pulse 0.8s ease-in-out infinite alternate",
              }}
            >
              {chamadaAtiva.senha}
            </div>

            <div
              style={{
                fontSize: "clamp(24px, 4vw, 36px)",
                fontWeight: 700,
                color: "#e2e8f0",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              {chamadaAtiva.paciente}
            </div>

            <div style={{ fontSize: 16, color: "#94a3b8", marginBottom: 28, fontWeight: 500 }}>
              {chamadaAtiva.especialidade}
            </div>

            {chamadaAtiva.consultorio ? (
              <div
                style={{
                  background: "linear-gradient(135deg, #1e3a5f, #1a3050)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 16,
                  padding: "20px 32px",
                  marginBottom: 20,
                }}
              >
                <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
                  Dirija-se ao
                </div>
                <div style={{ fontSize: "clamp(28px, 6vw, 48px)", fontWeight: 900, color: "#38bdf8", letterSpacing: 1 }}>
                  {chamadaAtiva.consultorio.numero}
                </div>
                <div style={{ fontSize: 16, color: "#cbd5e1", marginTop: 4 }}>
                  {chamadaAtiva.consultorio.nome}
                  {chamadaAtiva.consultorio.andar && ` · ${chamadaAtiva.consultorio.andar}`}
                  {chamadaAtiva.consultorio.bloco && ` · Bloco ${chamadaAtiva.consultorio.bloco}`}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 16,
                  padding: "16px 24px",
                  marginBottom: 20,
                  color: "#94a3b8",
                  fontSize: 16,
                }}
              >
                📍 Dirija-se ao balcão de atendimento
              </div>
            )}

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: `${corPrioridade(chamadaAtiva.prioridade)}22`,
                border: `1px solid ${corPrioridade(chamadaAtiva.prioridade)}55`,
                borderRadius: 999,
                padding: "6px 18px",
                fontSize: 13,
                fontWeight: 600,
                color: corPrioridade(chamadaAtiva.prioridade),
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: corPrioridade(chamadaAtiva.prioridade),
                }}
              />
              {chamadaAtiva.prioridade}
            </div>
          </div>

          <button
            onClick={() => setMostrarFlash(false)}
            style={{
              position: "absolute",
              bottom: 40,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              color: "#94a3b8",
              padding: "8px 24px",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Continuar
          </button>
        </div>
      )}

      {/* ── Header do painel ── */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 40px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              boxShadow: "0 0 20px rgba(59,130,246,0.4)",
            }}
          >
            🏥
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>Gestão Hospitalar</div>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase" }}>
              Painel de Chamadas
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: 2, fontVariantNumeric: "tabular-nums" }}>
            {relogio}
          </div>
          <div style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize", marginTop: 2 }}>
            {data}
          </div>
        </div>
      </header>

      {/* ── Corpo ── */}
      <main style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 380px", gap: 0, overflow: "hidden" }}>

        {/* Coluna esquerda — chamada atual */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "40px 60px",
            borderRight: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          {chamadaAtiva ? (
            <>
              <div style={{ fontSize: 13, color: "#64748b", fontWeight: 600, letterSpacing: 3, textTransform: "uppercase", marginBottom: 24 }}>
                Em atendimento
              </div>

              <div
                style={{
                  fontSize: "clamp(100px, 20vw, 180px)",
                  fontWeight: 900,
                  lineHeight: 1,
                  letterSpacing: -6,
                  color: "#fff",
                  textShadow: `0 0 80px ${corTipo(chamadaAtiva.tipoFila)}88`,
                  marginBottom: 12,
                }}
              >
                {chamadaAtiva.senha}
              </div>

              <div
                style={{
                  fontSize: "clamp(22px, 3.5vw, 32px)",
                  fontWeight: 700,
                  color: "#e2e8f0",
                  textTransform: "uppercase",
                  letterSpacing: 3,
                  marginBottom: 6,
                  textAlign: "center",
                }}
              >
                {chamadaAtiva.paciente}
              </div>

              <div style={{ fontSize: 15, color: "#64748b", marginBottom: 32, fontWeight: 500 }}>
                {chamadaAtiva.especialidade}
              </div>

              {chamadaAtiva.consultorio ? (
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(56,189,248,0.12), rgba(59,130,246,0.08))",
                    border: "1px solid rgba(56,189,248,0.3)",
                    borderRadius: 20,
                    padding: "24px 48px",
                    textAlign: "center",
                    marginBottom: 24,
                  }}
                >
                  <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>
                    Dirija-se ao
                  </div>
                  <div style={{ fontSize: "clamp(40px, 8vw, 72px)", fontWeight: 900, color: "#38bdf8", lineHeight: 1, marginBottom: 8 }}>
                    {chamadaAtiva.consultorio.numero}
                  </div>
                  <div style={{ fontSize: 16, color: "#94a3b8" }}>
                    {chamadaAtiva.consultorio.nome}
                    {chamadaAtiva.consultorio.andar && ` · Piso ${chamadaAtiva.consultorio.andar}`}
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 16,
                    padding: "16px 32px",
                    color: "#64748b",
                    fontSize: 15,
                    marginBottom: 24,
                  }}
                >
                  Dirija-se ao balcão de atendimento
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#475569", fontSize: 13 }}>
                <span>⏱</span>
                <span>
                  Chamado há{" "}
                  {tempoEspera < 60
                    ? `${tempoEspera}s`
                    : `${Math.floor(tempoEspera / 60)}min ${tempoEspera % 60}s`}
                </span>
                <span>·</span>
                <span>{formatarHora(chamadaAtiva.chamadoEm)}</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", color: "#334155" }}>
              <div style={{ fontSize: 80, marginBottom: 16 }}>🔔</div>
              <div style={{ fontSize: 22, fontWeight: 600 }}>A aguardar chamadas...</div>
              <div style={{ fontSize: 14, marginTop: 8, color: "#1e293b" }}>
                O sistema irá anunciar automaticamente quando um paciente for chamado.
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita — histórico */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "rgba(0,0,0,0.2)",
          }}
        >
          <div
            style={{
              padding: "20px 24px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}
          >
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
              Chamados recentes
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
            {chamados.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center", color: "#334155", fontSize: 14 }}>
                Nenhuma chamada recente
              </div>
            ) : (
              chamados.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "14px 24px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    background:
                      idx === 0 && chamadaAtiva?.id === item.id
                        ? "rgba(59,130,246,0.08)"
                        : "transparent",
                    transition: "background 0.3s",
                  }}
                >
                  <div
                    style={{
                      minWidth: 60,
                      height: 40,
                      borderRadius: 8,
                      background:
                        item.tipoFila === "URGENCIA"
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(59,130,246,0.15)",
                      border: `1px solid ${item.tipoFila === "URGENCIA" ? "rgba(239,68,68,0.4)" : "rgba(59,130,246,0.4)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                      fontWeight: 800,
                      color: item.tipoFila === "URGENCIA" ? "#fca5a5" : "#93c5fd",
                      flexShrink: 0,
                    }}
                  >
                    {item.senha}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#e2e8f0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.paciente}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
                      {item.consultorio?.numero ?? "Balcão"} · {item.especialidade}
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: "#334155", flexShrink: 0 }}>
                    {formatarHora(item.chamadoEm)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: "10px 40px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 11, color: "#1e293b", fontWeight: 500 }}>
          Atualizado automaticamente a cada 5 segundos
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
              animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
          <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>Sistema ativo</span>
        </div>
      </footer>

      {/* ── Animações CSS ── */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes pulse {
          from { text-shadow: 0 0 40px rgba(59,130,246,0.6); }
          to   { text-shadow: 0 0 80px rgba(59,130,246,1); }
        }
      `}</style>
    </div>
  );
}
