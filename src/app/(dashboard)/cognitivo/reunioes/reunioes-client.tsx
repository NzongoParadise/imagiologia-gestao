"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UsersRound, Loader2, Plus, FileText, AlertOctagon, CalendarDays, CheckCircle2 } from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import { criarReuniao, concluirReuniao, listarReunioes, adicionarDecisao } from "@/server/actions/cognitivo-actions";
import type { ReuniaoClinica } from "@/features/cognitivo/types";
import { formatDate } from "@/utils/format";

interface PacienteAux { id: number; nome: string; numeroProcesso: string; }
interface ExameAux { id: number; codigo: string | null; dataExame: string; estado: string; paciente?: { nome: string }; tipoExame?: { nome: string }; }
interface UtilizadorAux { id: number; nome: string; role: string; }

interface Props {
  pacientes: PacienteAux[];
  exames: ExameAux[];
  utilizadores: UtilizadorAux[];
  reunioes: ReuniaoClinica[];
}

const estadoBadge: Record<string, { label: string; cls: string }> = {
  agendada: { label: "Agendada", cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  em_curso: { label: "Em curso", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  concluida: { label: "Concluída", cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
};

export function ReunioesClient({ pacientes, exames, utilizadores, reunioes: initial }: Props) {
  const [lista, setLista] = useState<ReuniaoClinica[]>(initial);
  const [titulo, setTitulo] = useState("");
  const [pacienteId, setPacienteId] = useState<number | "">("");
  const [descricao, setDescricao] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [participantes, setParticipantes] = useState<number[]>([]);
  const [examesIds, setExamesIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [decisaoTexto, setDecisaoTexto] = useState<Record<number, string>>({});

  function toggleParticipante(id: number) {
    setParticipantes((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }
  function toggleExame(id: number) {
    setExamesIds((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  }

  async function criar() {
    if (!titulo || !dataHora) {
      setErro("Preencha pelo menos o título e a data/hora.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const nova = await criarReuniao({
        titulo,
        pacienteId: pacienteId ? Number(pacienteId) : null,
        descricao: descricao || undefined,
        dataHora,
        participantesIds: participantes,
        examesIds: examesIds.length ? examesIds : undefined,
      });
      setLista((prev) => [nova, ...prev]);
      setTitulo(""); setPacienteId(""); setDescricao(""); setDataHora(""); setParticipantes([]); setExamesIds([]);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao criar reunião.");
    } finally {
      setLoading(false);
    }
  }

  async function concluir(id: number) {
    try {
      const atualizada = await concluirReuniao(id);
      setLista((prev) => prev.map((r) => (r.id === id ? atualizada : r)));
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao concluir reunião.");
    }
  }

  async function gravarDecisao(reuniaoId: number) {
    const texto = decisaoTexto[reuniaoId];
    if (!texto) return;
    try {
      await adicionarDecisao(reuniaoId, texto);
      const updated = await listarReunioes();
      setLista(updated);
      setDecisaoTexto((prev) => ({ ...prev, [reuniaoId]: "" }));
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao gravar decisão.");
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UsersRound className="h-6 w-6 text-primary" />
          Reunião Clínica
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Agende reuniões clínicas, partilhe exames e registe decisões e atas automaticamente.
        </p>
      </div>

      <CognitivoCard title="Criar Reunião" subtitle="Agende e configure a reunião clínica">
        <div className="grid gap-3 sm:grid-cols-2">
          <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Título da reunião"
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <select value={pacienteId} onChange={(e) => setPacienteId(e.target.value ? Number(e.target.value) : "")}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Paciente (opcional)</option>
            {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nome} · {p.numeroProcesso}</option>)}
          </select>
          <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição / ordem do dia" rows={2}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Participantes</p>
          <div className="flex flex-wrap gap-2">
            {utilizadores.map((u) => (
              <button key={u.id} onClick={() => toggleParticipante(u.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border ${participantes.includes(u.id) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>
                {u.nome}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Exames a partilhar</p>
          <div className="flex flex-wrap gap-2">
            {exames.slice(0, 30).map((e) => (
              <button key={e.id} onClick={() => toggleExame(e.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border ${examesIds.includes(e.id) ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border"}`}>
                {e.tipoExame?.nome || "Exame"} · {e.codigo || `#${e.id}`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <button onClick={criar} disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Criar Reunião
          </button>
        </div>
        {erro && <p className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertOctagon className="h-4 w-4" /> {erro}</p>}
      </CognitivoCard>

      <CognitivoCard title="Reuniões" subtitle="Agendadas e concluídas">
        {lista.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <CalendarDays className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhuma reunião registada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map((r) => (
              <div key={r.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{r.titulo}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(r.dataHora)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${estadoBadge[r.estado]?.cls || "bg-muted text-muted-foreground"}`}>
                    {estadoBadge[r.estado]?.label || r.estado}
                  </span>
                </div>
                {r.paciente && <p className="mt-2 text-xs text-muted-foreground">Paciente: {r.paciente.nome}</p>}
                {r.descricao && <p className="mt-1 text-sm text-muted-foreground">{r.descricao}</p>}

                {r.participantes && r.participantes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.participantes.map((p) => (
                      <span key={p.id} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{p.utilizador?.nome}</span>
                    ))}
                  </div>
                )}

                {r.examesPartilhados && r.examesPartilhados.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.examesPartilhados.map((e) => (
                      <span key={e.id} className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                        {e.exame?.tipoExame?.nome || "Exame"} · {e.exame?.codigo || ""}
                      </span>
                    ))}
                  </div>
                )}

                {r.decisoes && r.decisoes.length > 0 && (
                  <div className="mt-3 rounded-md bg-muted/50 p-2">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1">Decisões</p>
                    {r.decisoes.map((d) => (
                      <p key={d.id} className="text-xs mb-0.5">• {d.descricao} <span className="text-muted-foreground">[{d.estado}]</span></p>
                    ))}
                  </div>
                )}

                {r.ata && (
                  <div className="mt-3 rounded-md bg-muted/50 p-2">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1"><FileText className="h-3 w-3 inline mr-1" />Ata</p>
                    <pre className="whitespace-pre-wrap text-xs font-sans">{r.ata}</pre>
                  </div>
                )}

                {r.estado !== "concluida" && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <input value={decisaoTexto[r.id] || ""} onChange={(e) => setDecisaoTexto((prev) => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Registar decisão..." className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <button onClick={() => gravarDecisao(r.id)} className="rounded-lg border bg-card px-3 text-xs font-medium text-muted-foreground hover:bg-accent">Decisão</button>
                    </div>
                    <button onClick={() => concluir(r.id)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Concluir e gerar ata
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CognitivoCard>
    </motion.div>
  );
}

export default ReunioesClient;
