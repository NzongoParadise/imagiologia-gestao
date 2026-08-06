"use client";

import { cn } from "@/utils/cn";
import { TrendingUp, TrendingDown, Minus, GitCompareArrows } from "lucide-react";

export type Evolucao = "melhora" | "piora" | "sem_alteracoes";

interface ComparisonResultProps {
  evolucao: Evolucao;
  detalhes?: string;
  examesComparados?: { anterior: string; atual: string };
  className?: string;
}

const config: Record<
  Evolucao,
  { label: string; icon: typeof TrendingUp; classes: string }
> = {
  melhora: {
    label: "Melhora",
    icon: TrendingUp,
    classes: "border-green-200 bg-green-50 text-green-800 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-300",
  },
  piora: {
    label: "Piora",
    icon: TrendingDown,
    classes: "border-red-200 bg-red-50 text-red-800 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300",
  },
  sem_alteracoes: {
    label: "Sem alterações",
    icon: Minus,
    classes: "border-muted bg-muted/50 text-foreground",
  },
};

export function ComparisonResult({
  evolucao,
  detalhes,
  examesComparados,
  className,
}: ComparisonResultProps) {
  const cfg = config[evolucao];
  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-xl border p-5", cfg.classes, className)}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide opacity-80">
        <GitCompareArrows className="h-4 w-4" />
        Evolução
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/50 dark:bg-black/20">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-lg font-bold">{cfg.label}</p>
          {examesComparados && (
            <p className="text-xs opacity-80">
              {examesComparados.anterior} → {examesComparados.atual}
            </p>
          )}
        </div>
      </div>

      {detalhes && <p className="mt-3 text-sm leading-relaxed">{detalhes}</p>}
    </div>
  );
}
