"use client";

import { cn } from "@/utils/cn";
import { Stethoscope, Sparkles, AlertTriangle } from "lucide-react";
import { ConfidenceScore } from "./ConfidenceScore";

interface DiagnosisCardProps {
  diagnostico: string;
  confidence: number;
  resumo?: string;
  modelo?: string;
  className?: string;
}

export function DiagnosisCard({
  diagnostico,
  confidence,
  resumo,
  modelo = "TorchXRayVision",
  className,
}: DiagnosisCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-5",
        className
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-4 w-4" />
          Diagnóstico Sugerido por IA
        </div>

        <div className="mt-3 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Stethoscope className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold leading-tight">{diagnostico}</h3>
            <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
              Modelo: {modelo}
            </p>
          </div>
        </div>

        {resumo && (
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">{resumo}</p>
        )}

        <div className="mt-5">
          <ConfidenceScore value={confidence} size="md" />
        </div>

        <div className="mt-5 flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800 dark:border-yellow-900/40 dark:bg-yellow-900/20 dark:text-yellow-300">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Ferramenta de apoio à decisão clínica. O diagnóstico definitivo pertence
            sempre ao médico responsável após correlação com o quadro clínico.
          </p>
        </div>
      </div>
    </div>
  );
}
