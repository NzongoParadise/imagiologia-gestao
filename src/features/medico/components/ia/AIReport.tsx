"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { FileSignature, Loader2, Save, Wand2, PenLine } from "lucide-react";
import { atualizarPreLaudoIA, transformarPreLaudoEmLaudo } from "@/server/actions/medico-actions";

interface AIReportProps {
  analiseId: number;
  exameId: number;
  preLaudo: string | null;
  className?: string;
}

export function AIReport({ analiseId, exameId, preLaudo: initialPreLaudo, className }: AIReportProps) {
  const [preLaudo, setPreLaudo] = useState(initialPreLaudo || "");
  const [guardando, setGuardando] = useState(false);
  const [transformando, setTransformando] = useState(false);

  async function handleGuardar() {
    if (!preLaudo.trim()) {
      toast.error("O pré-laudo não pode estar vazio");
      return;
    }
    setGuardando(true);
    try {
      await atualizarPreLaudoIA(analiseId, preLaudo);
      toast.success("Pré-laudo guardado com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao guardar pré-laudo");
    } finally {
      setGuardando(false);
    }
  }

  async function handleTransformar() {
    if (!preLaudo.trim()) {
      toast.error("O pré-laudo não pode estar vazio");
      return;
    }
    setTransformando(true);
    try {
      await transformarPreLaudoEmLaudo(analiseId, preLaudo);
      toast.success("Pré-laudo transformado em laudo oficial");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao transformar pré-laudo em laudo");
    } finally {
      setTransformando(false);
    }
  }

  return (
    <div className={cn("rounded-xl border bg-card", className)}>
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileSignature className="h-4 w-4 text-primary" />
          Pré-laudo Gerado por IA
        </h2>
        <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-medium text-primary">
          <Wand2 className="h-3 w-3" />
          Editável
        </span>
      </div>

      <div className="p-5">
        <textarea
          value={preLaudo}
          onChange={(e) => setPreLaudo(e.target.value)}
          rows={12}
          className="w-full resize-y rounded-lg border bg-muted/40 p-3 font-mono text-sm leading-relaxed focus:border-primary focus:bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
          placeholder="Texto gerado pela IA. Revise e edite conforme o quadro clínico..."
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
          >
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {guardando ? "A guardar..." : "Guardar pré-laudo"}
          </button>
          <button
            onClick={handleTransformar}
            disabled={transformando}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {transformando ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
            {transformando ? "A transformar..." : "Transformar em laudo oficial"}
          </button>
        </div>

        <p className="mt-4 text-[11px] text-muted-foreground">
          O texto acima é um pré-laudo gerado automaticamente. Deve ser revisto,
          corrigido e validado pelo médico antes de ser transformado em laudo oficial.
        </p>
      </div>
    </div>
  );
}
