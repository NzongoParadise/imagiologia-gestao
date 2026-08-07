"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Timeline,
  Stethoscope,
  ClipboardPlus,
  Calendar,
  Microscope,
  Image as ImageIcon,
  FileText,
  BrainCircuit,
  Activity,
  Users,
  Loader2,
  Search,
} from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import { obterLinhaTemporal } from "@/server/actions/cognitivo-actions";
import type { MarcoTemporal } from "@/features/cognitivo/types";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

interface Props {
  pacientes: { id: number; nome: string; numeroProcesso: string }[];
}

const tipoIcon: Record<string, { icon: typeof Timeline; color: string }> = {
  Consulta: { icon: Stethoscope, color: "bg-blue-600" },
  Solicitação: { icon: ClipboardPlus, color: "bg-indigo-600" },
  Realização: { icon: Microscope, color: "bg-cyan-600" },
  Imagens: { icon: ImageIcon, color: "bg-emerald-600" },
  Laudo: { icon: FileText, color: "bg-violet-600" },
  IA: { icon: BrainCircuit, color: "bg-fuchsia-600" },
  Tratamento: { icon: Activity, color: "bg-amber-600" },
  Retorno: { icon: Users, color: "bg-teal-600" },
  Alta: { icon: Activity, color: "bg-green-600" },
  Reunião: { icon: Users, color: "bg-rose-600" },
};

export function LinhaTemporalClient({ pacientes }: Props) {
  const [pacienteId, setPacienteId] = useState<number | "">("");
  const [marcos, setMarcos] = useState<MarcoTemporal[]>([]);
  const [pacienteNome, setPacienteNome] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState<string>("");

  async function carregar(id: number) {
    setLoading(true);
    setPacienteId(id);
    try {
      const resultado = await obterLinhaTemporal(id);
      setMarcos(resultado.marcos);
      setPacienteNome(resultado.paciente?.nome || null);
    } catch {
      setMarcos([]);
      setPacienteNome(null);
    } finally {
      setLoading(false);
    }
  }

  const marcosFiltrados = filtro ? marcos.filter((m) => m.tipo === filtro) : marcos;
  const tiposDisponiveis = [...new Set(marcos.map((m) => m.tipo))];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Timeline className="h-6 w-6 text-primary" />
          Linha Temporal Clínica
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Evolução cronológica completa de cada paciente — da consulta à alta.
        </p>
      </div>

      <CognitivoCard title="Selecionar Paciente" subtitle="Escolha um paciente para visualizar a sua linha temporal clínica">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={pacienteId}
              onChange={(e) => e.target.value && carregar(Number(e.target.value))}
              className="w-full rounded-lg border bg-background pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selecione um paciente...</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} ({p.numeroProcesso})</option>
              ))}
            </select>
          </div>
          {tiposDisponiveis.length > 0 && (
            <select
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos os tipos</option>
              {tiposDisponiveis.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
      </CognitivoCard>

      {loading && (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}

      {!loading && pacienteNome && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{pacienteNome}</h2>
            <span className="text-xs text-muted-foreground">{marcos.length} eventos</span>
          </div>

          <div className="relative border-l-2 border-muted ml-4 pl-6 space-y-6">
            {marcosFiltrados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum evento para este filtro.</p>
            ) : (
              marcosFiltrados.map((m) => {
                const meta = tipoIcon[m.tipo] || { icon: Activity, color: "bg-slate-600" };
                const Icon = meta.icon;
                return (
                  <motion.div key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="relative">
                    <div className={cn("absolute -left-[35px] flex h-7 w-7 items-center justify-center rounded-full text-white", meta.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div>
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{m.tipo}</span>
                          <h3 className="font-semibold mt-0.5">{m.titulo}</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(m.data)}</span>
                      </div>
                      {m.descricao && <p className="text-sm text-muted-foreground mt-2">{m.descricao}</p>}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      )}

      {!loading && !pacienteNome && (
        <CognitivoCard>
          <div className="flex flex-col items-center py-12 text-center text-muted-foreground">
            <Calendar className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Selecione um paciente</p>
            <p className="text-xs mt-1">A timeline mostrará consulta, solicitação, realização, imagens, laudo, tratamento, retorno e alta.</p>
          </div>
        </CognitivoCard>
      )}
    </motion.div>
  );
}
