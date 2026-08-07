"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ScanSearch,
  Image as ImageIcon,
  FileText,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import type { RegiaoAnatomica, RegiaoGrupo } from "@/features/cognitivo/types";
import { formatDate } from "@/utils/format";
import { cn } from "@/utils/cn";

interface Props {
  regioes: RegiaoAnatomica[];
  exames: { id: number; codigo: string | null; dataExame: string; estado: string; paciente?: { nome: string }; tipoExame?: { nome: string } }[];
}

const grupoPosicao: Record<string, { label: string; pos: string }> = {
  cabeca: { label: "Cabeça", pos: "top-1" },
  torax: { label: "Tórax", pos: "top-[22%]" },
  abdomen: { label: "Abdômen", pos: "top-[40%]" },
  pelve: { label: "Pelve", pos: "top-[52%]" },
  coluna: { label: "Coluna", pos: "top-[8%]" },
  membros: { label: "Membros", pos: "bottom-4" },
};

const riscoCor = (nivel: string) => {
  if (nivel === "critico") return "bg-red-500 text-white";
  if (nivel === "alerta") return "bg-amber-500 text-white";
  return "bg-emerald-500 text-white";
};

export function DigitalTwinClient({ regioes, exames }: Props) {
  const [regiaoSelecionada, setRegiaoSelecionada] = useState<RegiaoAnatomica | null>(null);

  const regioesAgrupadas = regioes.reduce<Record<string, RegiaoAnatomica[]>>((acc, r) => {
    (acc[r.grupo] = acc[r.grupo] || []).push(r);
    return acc;
  }, {});

  const nivelRisco = (r: RegiaoAnatomica): "critico" | "alerta" | "normal" => {
    const max = r.indicadores?.reduce((m, i) => Math.max(m, i.valor), 0) || 0;
    if (r.indicadores?.some((i) => i.nivel === "critico") || max >= 80) return "critico";
    if (r.indicadores?.some((i) => i.nivel === "alerta") || max >= 50) return "alerta";
    if (r.exames?.length === 0) return "normal";
    return "normal";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScanSearch className="h-6 w-6 text-primary" />
          Digital Twin Radiológico
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mapa corporal inteligente — indicadores de risco por órgão com base nos exames.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Mapa corporal estilizado */}
        <CognitivoCard title="Mapa Corporal" subtitle="Clique numa região para ver detalhes">
          <div className="relative mx-auto w-56">
            {/* Silhueta humana simplificada */}
            <div className="relative h-96 w-full rounded-t-full rounded-b-3xl border-2 border-muted-foreground/20 bg-gradient-to-b from-primary/5 to-muted/5 flex flex-col items-center pt-10">
              {/* Cabeça */}
              <div className="h-16 w-16 rounded-full border-2 border-muted-foreground/20 bg-muted/30" />
              <div className="h-3 w-1 bg-muted-foreground/20" />
              {/* Tórax */}
              <div className="h-24 w-28 rounded-t-full border-2 border-muted-foreground/20 bg-muted/30" />
              {/* Abdômen */}
              <div className="h-16 w-24 border-2 border-t-0 border-muted-foreground/20 bg-muted/30" />
              {/* Pelve */}
              <div className="h-12 w-20 border-2 border-t-0 border-muted-foreground/20 bg-muted/30" />
              {/* Membros inferiores */}
              <div className="flex gap-2 mt-0">
                <div className="h-20 w-7 border-2 border-t-0 border-muted-foreground/20 bg-muted/30" />
                <div className="h-20 w-7 border-2 border-t-0 border-muted-foreground/20 bg-muted/30" />
              </div>
            </div>

            {/* Marcadores de risco */}
            {regioes.map((r) => {
              const meta = grupoPosicao[r.grupo] || grupoPosicao.torax;
              const nivel = nivelRisco(r);
              return (
                <button
                  key={r.id}
                  onClick={() => setRegiaoSelecionada(r)}
                  title={r.nomePT}
                  className={cn(
                    "absolute left-1/2 -translate-x-1/2 z-10 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold shadow-md transition-transform hover:scale-125",
                    riscoCor(nivel)
                  )}
                  style={{ height: 20, width: 20 }}
                >
                  {r.exames?.length || 0}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Normal</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Alerta</span>
            <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Crítico</span>
          </div>
        </CognitivoCard>

        {/* Detalhes da região */}
        <CognitivoCard title={regiaoSelecionada?.nomePT || "Detalhes da Região"} subtitle={regiaoSelecionada?.descricao || "Selecione uma região anatómica para ver exames, laudos e indicadores."}>
          {!regiaoSelecionada ? (
            <div className="flex flex-col items-center py-16 text-center text-muted-foreground">
              <LayoutDashboard className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">Selecione uma região no mapa corporal à esquerda.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Indicadores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(regiaoSelecionada.indicadores || []).slice(0, 4).map((ind) => (
                  <div key={ind.id} className="rounded-lg border bg-card p-3">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", riscoCor(ind.nivel))} />
                      <span className="text-xs text-muted-foreground">{ind.tipo}</span>
                    </div>
                    <p className="text-lg font-bold mt-1">{ind.valor}</p>
                    <p className="text-[10px] text-muted-foreground">{ind.observacao || ind.nivel} · {formatDate(ind.medidoEm)}</p>
                  </div>
                ))}
                {(regiaoSelecionada.indicadores || []).length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-4">Sem indicadores registados para esta região.</p>
                )}
              </div>

              {/* Exames relacionados */}
              <div>
                <h3 className="text-sm font-semibold mb-3">Exames Relacionados ({regiaoSelecionada.exames?.length || 0})</h3>
                <div className="space-y-2">
                  {(regiaoSelecionada.exames || []).map((er) => {
                    const exame = er.exame;
                    return (
                      <div key={er.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                            <ImageIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{exame?.tipoExame?.nome || "Exame"}</p>
                            <p className="text-xs text-muted-foreground">{exame?.codigo} · {exame ? formatDate(exame.dataExame) : ""}</p>
                          </div>
                        </div>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", exame?.estado === "Concluído" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700")}>
                          {exame?.estado}
                        </span>
                      </div>
                    );
                  })}
                  {(regiaoSelecionada.exames || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">Nenhum exame associado a esta região.</p>
                  )}
                </div>
              </div>

              {/* Laudos */}
              {(regiaoSelecionada.exames || []).filter((er) => er.exame?.laudos?.[0]?.conteudo).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Laudos</h3>
                  <div className="space-y-2">
                    {(regiaoSelecionada.exames || []).filter((er) => er.exame?.laudos?.[0]?.conteudo).map((er) => (
                      <div key={er.id} className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{er.exame?.tipoExame?.nome}: </span>
                        {er.exame?.laudos?.[0]?.conteudo?.slice(0, 180)}
                        {!er.exame?.laudos?.[0]?.assinado && <span className="ml-1 text-xs text-amber-600 bg-amber-100 rounded px-1 py-0.5">Não assinado</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground">
                  <FileText className="h-3.5 w-3.5" /> Associar Exame
                </button>
              </div>
            </div>
          )}
        </CognitivoCard>
      </div>

      {/* Legenda de exames disponíveis */}
      <CognitivoCard title="Exames Disponíveis" subtitle="Associe exames a regiões anatómicas do mapa corporal">
        <div className="max-h-64 overflow-y-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {exames.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border p-2.5 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate">{e.tipoExame?.nome || "Exame"}</p>
                <p className="text-xs text-muted-foreground truncate">{e.paciente?.nome || e.codigo}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      </CognitivoCard>
    </motion.div>
  );
}
