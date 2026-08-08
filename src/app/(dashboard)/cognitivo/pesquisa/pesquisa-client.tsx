"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Loader2, Search, AlertOctagon, FileText, Download, ShieldCheck } from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import { obterDadosPesquisa } from "@/server/actions/cognitivo-actions";

interface LinhaPesquisa {
  id: string;
  numeroAnonimo: string;
  idadeAnonima: string | null;
  sexo: string | null;
  modalidade: string | null;
  tipoExame: string | null;
  diagnosticoClinico: string | null;
  laudo: string | null;
  laudoAssinado: boolean;
  iaDiagnostico: string | null;
  iaConfianca: number | null;
  dataExame: string;
}

interface ResultadoPesquisa {
  data: LinhaPesquisa[];
  total: number;
  pages: number;
  currentPage: number;
}

export function PesquisaClient() {
  const [diagnostico, setDiagnostico] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [sexo, setSexo] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
const [resultado, setResultado] = useState<ResultadoPesquisa | null>(null);

  async function pesquisar(p = 1) {
    setLoading(true);
    setErro(null);
    try {
      const res = await obterDadosPesquisa({
        diagnostico: diagnostico || undefined,
        modalidade: modalidade || undefined,
        sexo: sexo || undefined,
        inicio: inicio || undefined,
        fim: fim || undefined,
        page: p,
        limit: 50,
      });
      setResultado(res as ResultadoPesquisa);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro na pesquisa.");
    } finally {
      setLoading(false);
    }
  }

  function exportarCSV() {
    if (!resultado) return;
    const cabecalho = ["nº","idade","sexo","modalidade","tipo","diagnóstico","laudo","ia_diagnóstico","ia_confiança","data"];
    const linhas = resultado.data.map((r) => [
      r.numeroAnonimo, r.idadeAnonima || "", r.sexo || "", r.modalidade || "", r.tipoExame || "",
      r.diagnosticoClinico || "", (r.laudo || "").replace(/\n/g, " "), r.iaDiagnostico || "",
      r.iaConfianca != null ? String(r.iaConfianca) : "", r.dataExame || "",
    ]);
    const csv = [cabecalho, ...linhas].map((l) => l.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pesquisa-cientifica.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FlaskConical className="h-6 w-6 text-primary" />
            Pesquisa Científica
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pesquise dados clínicos anonimizados para fins de investigação.
          </p>
        </div>
        {resultado && resultado.data.length > 0 && (
          <button
            onClick={exportarCSV}
            className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </button>
        )}
      </div>

      {/* Aviso de anonimização */}
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-800 dark:text-amber-200">
        <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
        <p>Todos os dados apresentados são <strong>anonimizados</strong>: sem nomes, números de processo ou contactos. Apenas dados agregados e demográficos.</p>
      </div>

      {/* Filtros */}
      <CognitivoCard title="Filtros" subtitle="Refine a pesquisa por critérios clínicos e demográficos">
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
            {["Ressonância Magnética", "Tomografia Computadorizada", "Radiografia", "Ecografia", "Mamografia", "Densitometria Óssea"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
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
          <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="date" value={fim} onChange={(e) => setFim(e.target.value)} className="rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <button
            onClick={() => pesquisar(1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Pesquisar
          </button>
        </div>
        {erro && <p className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertOctagon className="h-4 w-4" /> {erro}</p>}
      </CognitivoCard>

      {/* Resultados */}
      {resultado && (
        <CognitivoCard title={`Resultados (${resultado.total})`} subtitle={`Página ${resultado.currentPage} de ${resultado.pages}`}>
          {resultado.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
          ) : (
            <div className="space-y-3">
              {resultado.data.map((r) => (
                <div key={r.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">{r.numeroAnonimo}</p>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      {r.idadeAnonima && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{r.idadeAnonima} anos</span>}
                      {r.sexo && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{r.sexo}</span>}
                      {r.modalidade && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">{r.modalidade}</span>}
                      {r.laudoAssinado && <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-emerald-700 dark:text-emerald-300">Laudo assinado</span>}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Data: {r.dataExame}</p>
                  {r.diagnosticoClinico && <p className="mt-1 text-sm"><span className="font-medium">D. clínico:</span> {r.diagnosticoClinico}</p>}
                  {r.laudo && (
                    <div className="mt-2 rounded-md bg-muted/50 p-2">
                      <p className="text-[11px] font-medium text-muted-foreground mb-1"><FileText className="h-3 w-3 inline mr-1" />Laudo</p>
                      <p className="text-xs">{r.laudo}</p>
                    </div>
                  )}
                  {r.iaDiagnostico && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">IA:</span> {r.iaDiagnostico}
                      {r.iaConfianca != null && <span className="ml-1">(confiança {r.iaConfianca}%)</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {resultado.pages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              {Array.from({ length: resultado.pages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                <button
                  key={p}
                  onClick={() => pesquisar(p)}
                  disabled={loading}
                  className={`h-8 w-8 rounded-lg text-xs font-medium ${p === resultado.currentPage ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </CognitivoCard>
      )}

      {!resultado && !loading && (
        <CognitivoCard>
          <div className="flex flex-col items-center py-12 text-muted-foreground">
            <FlaskConical className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Pesquise dados anonimizados</p>
            <p className="text-xs mt-1">Utilize os filtros para iniciar uma pesquisa científica.</p>
          </div>
        </CognitivoCard>
      )}
    </motion.div>
  );
}

export default PesquisaClient;
