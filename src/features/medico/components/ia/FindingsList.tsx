"use client";

import { cn } from "@/utils/cn";
import { Activity, CheckCircle2, XCircle } from "lucide-react";
import type { AchadoIA } from "@/features/medico/types/ia";

interface FindingsListProps {
  findings: AchadoIA[];
  className?: string;
}

function BadgePresente({ presente }: { presente: boolean }) {
  return presente ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
      <CheckCircle2 className="h-3 w-3" />
      Presente
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
      <XCircle className="h-3 w-3" />
      Ausente
    </span>
  );
}

export function FindingsList({ findings, className }: FindingsListProps) {
  if (!findings || findings.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-8 text-muted-foreground", className)}>
        <Activity className="h-8 w-8 mb-2 opacity-30" />
        <p className="text-sm">Nenhum achado detectado.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {findings.map((f, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium capitalize">{f.nome}</p>
            {f.descricao && (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{f.descricao}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs font-semibold">{Math.round(f.probabilidade)}%</span>
            <BadgePresente presente={f.presente} />
          </div>
        </div>
      ))}
    </div>
  );
}
