"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bot, Loader2, Send, AlertOctagon, MessageSquare, Sparkles } from "lucide-react";
import { CognitivoCard } from "@/features/cognitivo/components/ui/cognitivo-card";
import { perguntarIAGenerativa, listarSessoesIA } from "@/server/actions/cognitivo-actions";
import type { SessaoIA } from "@/features/cognitivo/types";
import { formatDate } from "@/utils/format";

interface Props {
  sessoes: SessaoIA[];
}

const sugestoes = [
  "Mostre pacientes com pneumonia acima de 60 anos",
  "Quantos casos existem na memória clínica?",
  "Como está a evolução de lesões?",
  "Existem contradições detetadas?",
  "Qual a previsão de demanda?",
  "Quantas segundas opiniões foram solicitadas?",
  "Mostre casos de tuberculose",
];

export function IaGenerativaClient({ sessoes: initial }: Props) {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [fontes, setFontes] = useState<{ tipo: string; descricao: string; id?: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sessoes, setSessoes] = useState<SessaoIA[]>(initial);

  function renderMarkdown(texto: string) {
    return texto.split("\n").map((linha, i) => {
      if (linha.trim() === "") return <div key={i} className="h-2" />;
      if (linha.startsWith("- ")) {
        return <p key={i} className="text-sm mb-1 flex gap-2"><span className="text-primary">•</span><span>{linha.slice(2)}</span></p>;
      }
      return <p key={i} className="text-sm mb-1">{linha}</p>;
    });
  }

  async function enviar(texto?: string) {
    const q = (texto ?? pergunta).trim();
    if (!q) return;
    setLoading(true);
    setErro(null);
    setResposta("");
    setFontes([]);
    try {
      const res = await perguntarIAGenerativa(q);
      setResposta(res.resposta);
      setFontes(res.fontes);
      const updated = await listarSessoesIA();
      setSessoes(updated);
      setPergunta("");
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao consultar a IA.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-primary" />
          IA Generativa
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Faça perguntas em linguagem natural e obtenha respostas baseadas nos dados reais do hospital.
        </p>
      </div>

      {/* Sugestões */}
      <div className="flex flex-wrap gap-2">
        {sugestoes.map((s) => (
          <button
            key={s}
            onClick={() => enviar(s)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            <Sparkles className="h-3 w-3 text-primary" /> {s}
          </button>
        ))}
      </div>

      {/* Chat */}
      <CognitivoCard title="Assistente Cognitivo" subtitle="Respostas baseadas em dados reais e anonimizados">
        <div className="space-y-3 mb-4">
          {resposta && (
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <p className="text-[11px] font-medium text-primary mb-2 flex items-center gap-1"><Bot className="h-3.5 w-3.5" /> Resposta</p>
              <div className="space-y-1">{renderMarkdown(resposta)}</div>
            </div>
          )}
          {fontes.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[11px] font-medium text-muted-foreground mb-1">Fontes consultadas</p>
              {fontes.map((f, i) => (
                <p key={i} className="text-xs text-muted-foreground">• {f.descricao}</p>
              ))}
            </div>
          )}
          {erro && <p className="flex items-center gap-2 text-sm text-red-600"><AlertOctagon className="h-4 w-4" /> {erro}</p>}
        </div>

        <div className="flex gap-2">
          <input
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") enviar(); }}
            placeholder="Faça uma pergunta sobre os dados clínicos..."
            className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => enviar()}
            disabled={loading || !pergunta.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </CognitivoCard>

      {/* Histórico de sessões */}
      <CognitivoCard title="Sessões Recentes" subtitle="Consultas anteriores">
        {sessoes.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground">
            <MessageSquare className="h-10 w-10 mb-2 opacity-30" />
            <p className="text-sm font-medium">Nenhuma sessão registada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sessoes.slice(0, 10).map((s) => (
              <div key={s.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{s.titulo}</p>
                  <span className="text-xs text-muted-foreground shrink-0">{formatDate(s.createdAt)}</span>
                </div>
                {s.mensagens && s.mensagens.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.mensagens[s.mensagens.length - 1].conteudo}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CognitivoCard>
    </motion.div>
  );
}

export default IaGenerativaClient;
