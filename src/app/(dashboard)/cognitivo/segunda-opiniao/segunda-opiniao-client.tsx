"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileSearch, Loader2, Plus, CheckCircle2, XCircle, AlertOctagon, MessageSquare } from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import {
  solicitarSegundaOpiniao,
  concluirSegundaOpiniao,
  listarSegundasOpinioes,
} from "@/server/actions/cognitivo-actions";
import type { SegundaOpiniao } from "@/features/cognitivo/types";
import { formatDate } from "@/utils/format";

interface ExameAux {
  id: number;
  codigo: string | null;
  dataExame: string;
  estado: string;
  paciente?: { nome: string };
  tipoExame?: { nome: string };
}

interface UtilizadorAux {
  id: number;
  nome: string;
  role: string;
}

interface Props {
  exames: ExameAux[];
  radiologistas: UtilizadorAux[];
  opinioes: SegundaOpiniao[];
}

const estadoBadge: Record<string, { label: string; cls: string }> = {
  solicitada: { label: "Solicitada", cls: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300" },
  em_analise: { label: "Em análise", cls: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" },
  concluida: { label: "Concluída", cls: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300" },
};

export function SegundaOpiniaoClient({ exames, radiologistas, opinioes: initial }: Props) {
  const [lista, setLista] = useState<SegundaOpiniao[]>(initial);
  const [exameId, setExameId] = useState<number | "">("");
  const [radiologistaId, setRadiologistaId] = useState<number | "">("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [concluirId, setConcluirId] = useState<number | null>(null);
  const [laudoSegunda, setLaudoSegunda] = useState("");
  const [coerente, setCoerente] = useState<boolean | null>(null);

  async function solicitar() {
    if (!exameId || !radiologistaId) {
      setErro("Selecione exame e radiologista.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      const nova = await solicitarSegundaOpiniao({
        exameId: Number(exameId),
        radiologistaId: Number(radiologistaId),
        motivo: motivo || undefined,
      });
      setLista((prev) => [nova, ...prev]);
      setExameId("");
      setRadiologistaId("");
      setMotivo("");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao solicitar segunda opinião.");
    } finally {
      setLoading(false);
    }
  }

  async function concluir() {
    if (!concluirId || coerente === null) {
      setErro("Preencha o laudo e indique se é coerente.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      await concluirSegundaOpiniao(concluirId, laudoSegunda, coerente);
      const updated = await listarSegundasOpinioes();
      setLista(updated);
      setConcluirId(null);
      setLaudoSegunda("");
      setCoerente(null);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao concluir segunda opinião.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileSearch className="h-6 w-6 text-primary" />
          Segunda Opinião
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Solicite revisão de exames por outro radiologista e compare com o laudo original.
        </p>
      </div>

      {/* Solicitar */}
      <CognitivoCard title="Solicitar Segunda Opinião" subtitle="Selecione exame e radiologista">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <select
              value={exameId}
              onChange={(e) => setExameId(e.target.value ? Number(e.target.value) : "")}
              className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione o exame...</option>
              {exames.map((e) => (
                <option key={e.id} value={e.id}>{e.tipoExame?.nome || "Exame"} · {e.codigo || `#${e.id}`} · {e.paciente?.nome || ""}</option>
              ))}
            </select>
            <select
              value={radiologistaId}
              onChange={(e) => setRadiologistaId(e.target.value ? Number(e.target.value) : "")}
              className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione o radiologista...</option>
              {radiologistas.map((r) => (
                <option key={r.id} value={r.id}>{r.nome} ({r.role})</option>
              ))}
            </select>
          </div>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo da solicitação (opcional)"
            rows={2}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div>
            <button
              onClick={solicitar}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Solicitar
            </button>
          </div>
        </div>
        {erro && <p className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertOctagon className="h-4 w-4" /> {erro}</p>}
      </CognitivoCard>

      {/* Lista */}
      <CognitivoCard title="Solicitações" subtitle="Histórico de segundas opiniões">
        {lista.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <FileSearch className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhuma solicitação registada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lista.map((o) => (
              <div key={o.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">#{o.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${estadoBadge[o.estado]?.cls || "bg-muted text-muted-foreground"}`}>
                      {estadoBadge[o.estado]?.label || o.estado}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(o.solicitadoEm)}</span>
                </div>
                <p className="mt-2 text-sm">
                  {o.exame?.tipoExame?.nome || "Exame"} · {o.exame?.codigo || `#${o.exame?.id}`} · {o.exame?.paciente?.nome || ""}
                </p>
                {o.radiologista && <p className="mt-1 text-xs text-muted-foreground">Radiologista: {o.radiologista.nome}</p>}
                {o.motivo && <p className="mt-1 text-xs text-muted-foreground">Motivo: {o.motivo}</p>}
                {o.laudoOriginal && (
                  <div className="mt-3 rounded-md bg-muted/50 p-2">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1">Laudo original</p>
                    <p className="text-xs">{o.laudoOriginal}</p>
                  </div>
                )}
                {o.laudoSegunda && (
                  <div className="mt-2 rounded-md bg-muted/50 p-2">
                    <p className="text-[11px] font-medium text-muted-foreground mb-1">Segunda opinião</p>
                    <p className="text-xs">{o.laudoSegunda}</p>
                    {o.coerente !== null && (
                      <p className={`mt-1 text-xs font-medium ${o.coerente ? "text-emerald-600" : "text-red-600"}`}>
                        {o.coerente ? "Coerente com o laudo original" : "Divergente do laudo original"}
                      </p>
                    )}
                  </div>
                )}

                {o.estado !== "concluida" && concluirId !== o.id && (
                  <button
                    onClick={() => { setConcluirId(o.id); setErro(null); }}
                    className="mt-3 inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Concluir
                  </button>
                )}

                {concluirId === o.id && (
                  <div className="mt-3 space-y-2 rounded-md border p-3">
                    <textarea
                      value={laudoSegunda}
                      onChange={(e) => setLaudoSegunda(e.target.value)}
                      placeholder="Laudo da segunda opinião"
                      rows={3}
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setCoerente(true)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${coerente === true ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Coerente
                      </button>
                      <button
                        onClick={() => setCoerente(false)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${coerente === false ? "bg-red-600 text-white" : "bg-muted text-muted-foreground"}`}
                      >
                        <XCircle className="h-3.5 w-3.5" /> Divergente
                      </button>
                      <button
                        onClick={concluir}
                        disabled={loading}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Guardar
                      </button>
                      <button
                        onClick={() => { setConcluirId(null); setLaudoSegunda(""); setCoerente(null); }}
                        className="rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                      >
                        Cancelar
                      </button>
                    </div>
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

export default SegundaOpiniaoClient;
