"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Map, Loader2, Search, AlertOctagon, Users, CalendarRange, Compass } from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import { obterRadarEpidemiologico } from "@/server/actions/cognitivo-actions";

interface DadoEpidemiologico {
  condicao: string;
  total: number;
  porSexo: { sexo: string; total: number }[];
  porFaixaEtaria: { label: string; total: number }[];
  porMes: { mes: string; total: number }[];
  porProcedencia: { procedencia: string; total: number }[];
  condicoesDisponiveis: string[];
}

const cores = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#d946ef"];

export function RadarEpidemiologicoClient() {
  const [condicao, setCondicao] = useState("pneumonia");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [dados, setDados] = useState<DadoEpidemiologico | null>(null);

  async function consultar() {
    setLoading(true);
    setErro(null);
    try {
      const res = await obterRadarEpidemiologico({
        condicao: condicao || undefined,
        inicio: inicio || undefined,
        fim: fim || undefined,
      });
      setDados(res as unknown as DadoEpidemiologico);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao consultar o radar epidemiológico.");
    } finally {
      setLoading(false);
    }
  }

  const maxBar = (arr: { total: number }[]) => (arr.length > 0 ? Math.max(...arr.map((a) => a.total)) : 1);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Map className="h-6 w-6 text-primary" />
          Radar Epidemiológico
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitorize a distribuição de condições clínicas por sexo, faixa etária, mês e procedência.
        </p>
      </div>

      {/* Filtros */}
      <CognitivoCard title="Consultar" subtitle="Selecione uma condição e o intervalo de datas">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={condicao}
            onChange={(e) => setCondicao(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {(dados?.condicoesDisponiveis || ["tuberculose", "pneumonia", "COVID", "AVC", "tumor", "fratura"]).map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={consultar}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Consultar
          </button>
        </div>
        {erro && <p className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertOctagon className="h-4 w-4" /> {erro}</p>}
      </CognitivoCard>

      {dados && (
        <>
          {/* Total */}
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs text-muted-foreground">Total de casos</p>
            <p className="mt-1 flex items-center gap-2 text-3xl font-bold">
              <Users className="h-6 w-6 text-primary" />
              {dados.total}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Condição: <span className="font-medium text-foreground capitalize">{dados.condicao}</span></p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Por sexo */}
            <CognitivoCard title="Por Sexo" icon={Users}>
              {dados.porSexo.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : dados.porSexo.map((s, i) => (
                <div key={s.sexo} className="mb-2">
                  <div className="flex justify-between text-xs mb-1"><span>{s.sexo}</span><span className="font-medium">{s.total}</span></div>
                  <div className="h-1.5 w-full rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(s.total / maxBar(dados.porSexo)) * 100}%`, background: cores[i % cores.length] }} /></div>
                </div>
              ))}
            </CognitivoCard>

            {/* Por faixa etária */}
            <CognitivoCard title="Por Faixa Etária" icon={Users}>
              {dados.porFaixaEtaria.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : dados.porFaixaEtaria.map((f, i) => (
                <div key={f.label} className="mb-2">
                  <div className="flex justify-between text-xs mb-1"><span>{f.label}</span><span className="font-medium">{f.total}</span></div>
                  <div className="h-1.5 w-full rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(f.total / maxBar(dados.porFaixaEtaria)) * 100}%`, background: cores[i % cores.length] }} /></div>
                </div>
              ))}
            </CognitivoCard>

            {/* Evolução mensal */}
            <CognitivoCard title="Evolução Mensal" icon={CalendarRange}>
              {dados.porMes.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : (
                <div className="flex items-end gap-1.5 h-32">
                  {dados.porMes.map((m) => (
                    <div key={m.mes} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded-t bg-primary" style={{ height: `${Math.max(4, (m.total / maxBar(dados.porMes)) * 100)}%` }} title={`${m.mes}: ${m.total}`} />
                      <span className="text-[9px] text-muted-foreground truncate">{m.mes.slice(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CognitivoCard>

            {/* Por procedência */}
            <CognitivoCard title="Por Procedência" icon={Compass}>
              {dados.porProcedencia.length === 0 ? <p className="text-sm text-muted-foreground">Sem dados.</p> : dados.porProcedencia.map((p, i) => (
                <div key={p.procedencia} className="mb-2">
                  <div className="flex justify-between text-xs mb-1"><span>{p.procedencia}</span><span className="font-medium">{p.total}</span></div>
                  <div className="h-1.5 w-full rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${(p.total / maxBar(dados.porProcedencia)) * 100}%`, background: cores[i % cores.length] }} /></div>
                </div>
              ))}
            </CognitivoCard>
          </div>
        </>
      )}

      {!dados && !loading && (
        <CognitivoCard>
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <Map className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Consulte o radar epidemiológico</p>
            <p className="text-xs mt-1">Escolha uma condição e intervalo para visualizar a distribuição.</p>
          </div>
        </CognitivoCard>
      )}
    </motion.div>
  );
}

export default RadarEpidemiologicoClient;
