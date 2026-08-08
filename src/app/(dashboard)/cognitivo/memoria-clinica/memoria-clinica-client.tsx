"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Database, Loader2, Search, AlertOctagon, CheckCircle2, XCircle, Filter } from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import { pesquisarMemoriaClinica } from "@/server/actions/cognitivo-actions";
import type { ResultadoMemoriaClinica } from "@/features/cognitivo/types";
import { formatDate } from "@/utils/format";

interface RegiaoAux {
  id: number;
  nome: string;
  nomePT: string;
  grupo: string;
}

interface TipoExameAux {
  id: number;
  nome: string;
  modalidade: string | null;
}

interface Props {
  regioes: RegiaoAux[];
  tiposExame: TipoExameAux[];
}

export function MemoriaClinicaClient({ regioes, tiposExame }: Props) {
  const [diagnostico, setDiagnostico] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [regiaoId, setRegiaoId] = useState<number | "">("");
  const [sexo, setSexo] = useState("");
  const [faixaEtaria, setFaixaEtaria] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoMemoriaClinica | null>(null);

const modalidades: string[] = [];
  for (const t of tiposExame) {
    if (t.modalidade && !modalidades.includes(t.modalidade)) {
      modalidades.push(t.modalidade);
    }
  }

  async function pesquisar() {
    setLoading(true);
    setErro(null);
    try {
      const res = await pesquisarMemoriaClinica({
        diagnostico: diagnostico || undefined,
        modalidade: modalidade || undefined,
        regiaoId: regiaoId ? Number(regiaoId) : undefined,
        sexo: sexo || undefined,
        faixaEtaria: faixaEtaria || undefined,
      });
      setResultado(res as ResultadoMemoriaClinica);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao pesquisar memória clínica.");
    } finally {
      setLoading(false);
    }
  }

  const maxAgrupamento = (arr: { total: number }[]) => (arr.length > 0 ? Math.max(...arr.map((a) => a.total)) : 1);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          Memória Clínica Hospitalar
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pesquise casos clínicos semelhantes de forma anonimizada, por diagnóstico, modalidade, região, sexo e faixa etária.
        </p>
      </div>

      {/* Filtros */}
      <CognitivoCard title="Pesquisar Casos" subtitle="Filtre a memória clínica por critérios clínicos">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input
            value={diagnostico}
            onChange={(e) => setDiagnostico(e.target.value)}
            placeholder="Diagnóstico (ex.: pneumonia)"
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={modalidade}
            onChange={(e) => setModalidade(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Modalidade</option>
            {modalidades.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <select
            value={regiaoId}
            onChange={(e) => setRegiaoId(e.target.value ? Number(e.target.value) : "")}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Região anatómica</option>
            {regioes.map((r) => <option key={r.id} value={r.id}>{r.nomePT || r.nome}</option>)}
          </select>
          <select
            value={sexo}
            onChange={(e) => setSexo(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sexo</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </select>
          <select
            value={faixaEtaria}
            onChange={(e) => setFaixaEtaria(e.target.value)}
            className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Faixa etária</option>
            <option value="0-17">0-17</option>
            <option value="18-39">18-39</option>
            <option value="40-64">40-64</option>
            <option value="65+">65+</option>
          </select>
          <button
            onClick={pesquisar}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Pesquisar
          </button>
        </div>
        {erro && (
          <p className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertOctagon className="h-4 w-4" /> {erro}</p>
        )}
      </CognitivoCard>

      {/* Resultado */}
      {resultado && (
        <>
          {/* Resumo */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Casos encontrados</p>
              <p className="text-2xl font-bold mt-1">{resultado.total}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Confirmados</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{resultado.confirmados}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Descartados</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{resultado.descartados}</p>
            </div>
          </div>

          {/* Agrupamentos */}
          <div className="grid gap-4 md:grid-cols-3">
            <CognitivoCard title="Por Faixa Etária" icon={Filter}>
              {resultado.agrupamentoIdade.map((a) => (
                <div key={a.label} className="mb-2">
                  <div className="flex justify-between text-xs mb-1"><span>{a.label}</span><span className="font-medium">{a.total}</span></div>
                  <div className="h-1.5 w-full rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(a.total / maxAgrupamento(resultado.agrupamentoIdade)) * 100}%` }} /></div>
                </div>
              ))}
            </CognitivoCard>
            <CognitivoCard title="Por Sexo" icon={Filter}>
              {resultado.agrupamentoSexo.map((a) => (
                <div key={a.label} className="mb-2">
                  <div className="flex justify-between text-xs mb-1"><span>{a.label}</span><span className="font-medium">{a.total}</span></div>
                  <div className="h-1.5 w-full rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(a.total / maxAgrupamento(resultado.agrupamentoSexo)) * 100}%` }} /></div>
                </div>
              ))}
            </CognitivoCard>
            <CognitivoCard title="Por Desfecho" icon={Filter}>
              {resultado.agrupamentoDesfecho.map((a) => (
                <div key={a.label} className="mb-2">
                  <div className="flex justify-between text-xs mb-1"><span>{labelDesfecho(a.label)}</span><span className="font-medium">{a.total}</span></div>
                  <div className="h-1.5 w-full rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(a.total / maxAgrupamento(resultado.agrupamentoDesfecho)) * 100}%` }} /></div>
                </div>
              ))}
            </CognitivoCard>
          </div>

          {/* Casos */}
          {resultado.casos.length === 0 ? (
            <CognitivoCard><div className="flex flex-col items-center py-8 text-muted-foreground"><Database className="h-8 w-8 mb-2 opacity-30" /><p className="text-sm">Nenhum caso encontrado com os critérios.</p></div></CognitivoCard>
          ) : (
            <div className="space-y-3">
              {resultado.casos.map((c) => (
                <CognitivoCard key={c.id} title={c.diagnosticoPrincipal} subtitle={`${c.codigoAnonimo} · ${c.modalidade || "—"} · ${formatDate(c.createdAt)}`}>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-muted px-2 py-0.5">{c.sexo || "N/A"}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5">{c.faixaEtaria || "N/A"}</span>
                    {c.confirmado && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-3 w-3" /> Confirmado</span>}
                    {c.descartado && <span className="inline-flex items-center gap-1 rounded-full bg-red-100 dark:bg-red-900/30 px-2 py-0.5 text-red-700 dark:text-red-300"><XCircle className="h-3 w-3" /> Descartado</span>}
                  </div>
                  {c.laudoResumo && <p className="mt-3 text-sm text-muted-foreground">{c.laudoResumo}</p>}
                  {c.tratamento && <p className="mt-2 text-xs text-muted-foreground"><span className="font-medium">Tratamento:</span> {c.tratamento}</p>}
                  {c.desfecho && <p className="mt-1 text-xs text-muted-foreground"><span className="font-medium">Desfecho:</span> {labelDesfecho(c.desfecho)}</p>}
                </CognitivoCard>
              ))}
            </div>
          )}
        </>
      )}

      {!resultado && !loading && (
        <CognitivoCard><div className="flex flex-col items-center py-12 text-muted-foreground"><Search className="h-10 w-10 mb-2 opacity-30" /><p className="text-sm font-medium">Pesquise a memória clínica</p><p className="text-xs mt-1">Utilize os filtros para encontrar casos semelhantes anonimizados.</p></div></CognitivoCard>
      )}
    </motion.div>
  );
}

function labelDesfecho(d: string): string {
  const map: Record<string, string> = {
    em_tratamento: "Em tratamento",
    recuperado: "Recuperado",
    complicacao: "Complicação",
    obito: "Óbito",
  };
  return map[d] || d;
}

export default MemoriaClinicaClient;

