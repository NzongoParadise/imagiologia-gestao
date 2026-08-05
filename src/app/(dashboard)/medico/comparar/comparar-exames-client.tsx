"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, GitCompareArrows, Search, Image as ImageIcon } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";
import type { MedicoSolicitacao } from "@/features/medico/types";

interface Props {
  exames: MedicoSolicitacao[];
}

interface ExameComparavel {
  id: number;
  nome: string;
  data: string;
  pacienteNome: string;
  pacienteId: number;
  imagens: { id: number; url: string; name: string }[];
}

export function CompararExamesClient({ exames }: Props) {
  const [search, setSearch] = useState("");
  const [esquerda, setEsquerda] = useState<ExameComparavel | null>(null);
  const [direita, setDireita] = useState<ExameComparavel | null>(null);

  const examesComparaveis: ExameComparavel[] = useMemo(
    () =>
      exames.map((e) => ({
        id: e.id,
        nome: e.tipoExame?.nome || "Exame",
        data: e.dataExame,
        pacienteNome: e.paciente?.nome || "",
        pacienteId: e.paciente?.id || 0,
        imagens: (e.imagens || []).map((img) => ({
          id: img.id,
          url: img.path,
          name: img.originalName,
        })),
      })),
    [exames]
  );

  const filtrados = useMemo(() => {
    if (!search.trim()) return examesComparaveis;
    const q = search.toLowerCase();
    return examesComparaveis.filter(
      (e) =>
        e.nome.toLowerCase().includes(q) ||
        e.pacienteNome.toLowerCase().includes(q)
    );
  }, [examesComparaveis, search]);

  const selecionar = (lado: "esquerda" | "direita", exame: ExameComparavel) => {
    if (lado === "esquerda") setEsquerda(exame);
    else setDireita(exame);
  };

  const mesmaDataTipo = esquerda && direita && esquerda.nome === direita.nome;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link href="/medico" className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitCompareArrows className="h-6 w-6 text-primary" />
            Comparar Exames
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Compare exames realizados em diferentes datas.
          </p>
        </div>
      </div>

      {/* Seleção */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(["esquerda", "direita"] as const).map((lado) => {
          const selecionado = lado === "esquerda" ? esquerda : direita;
          return (
            <div key={lado} className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold mb-3">
                {lado === "esquerda" ? "Exame A" : "Exame B"}
              </h2>

              {selecionado ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-3">
                    <div>
                      <p className="text-sm font-medium">{selecionado.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {selecionado.pacienteNome} · {formatDate(selecionado.data)}
                      </p>
                    </div>
                    <button
                      onClick={() => lado === "esquerda" ? setEsquerda(null) : setDireita(null)}
                      className="rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                  {selecionado.imagens.length > 0 ? (
                    <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={selecionado.imagens[0].url}
                        alt={selecionado.nome}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-1 opacity-30" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Pesquisar exame por paciente ou tipo..."
                      value={lado === "esquerda" ? search : search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-lg border bg-background py-2 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto rounded-lg border divide-y">
                    {filtrados.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Nenhum exame encontrado
                      </div>
                    ) : (
                      filtrados.map((e) => (
                        <button
                          key={e.id}
                          onClick={() => selecionar(lado, e)}
                          className="w-full px-4 py-2.5 text-left hover:bg-accent transition-colors"
                        >
                          <p className="text-sm font-medium">{e.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {e.pacienteNome} · {formatDate(e.data)}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Comparação lado a lado */}
      {esquerda && direita && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border bg-card p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Comparação</h2>
            {mesmaDataTipo && (
              <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                Mesmo tipo de exame
              </span>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[esquerda, direita].map((exame) => (
              <div key={exame.id}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium">{exame.nome}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(exame.data)}</p>
                </div>
                {exame.imagens.length > 0 ? (
                  <div className="aspect-video overflow-hidden rounded-lg border bg-black/5">
                    <img
                      src={exame.imagens[0].url}
                      alt={exame.nome}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted text-muted-foreground">
                    <ImageIcon className="h-8 w-8 opacity-30" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <GitCompareArrows className="h-6 w-6 text-primary" />
          </div>
        </motion.div>
      )}

      {!esquerda || !direita ? (
        <div className="rounded-xl border border-dashed bg-card/50 p-8 text-center text-muted-foreground">
          <GitCompareArrows className="mx-auto h-10 w-10 mb-2 opacity-30" />
          <p className="text-sm">
            Selecione dois exames {esquerda ? "(faltam o Exame B)" : "(faltam o Exame A)"} para comparar.
          </p>
        </div>
      ) : null}
    </motion.div>
  );
}
