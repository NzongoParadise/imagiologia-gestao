"use client";

import { cn } from "@/utils/cn";

interface ConfidenceScoreProps {
  value: number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

function corConfianca(value: number): string {
  if (value >= 75) return "bg-green-500";
  if (value >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

function corTexto(value: number): string {
  if (value >= 75) return "text-green-600 dark:text-green-400";
  if (value >= 50) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

const tamanhos = {
  sm: { barra: "h-1.5", texto: "text-xs", anel: "h-10 w-10", fonte: "text-sm" },
  md: { barra: "h-2", texto: "text-sm", anel: "h-14 w-14", fonte: "text-lg" },
  lg: { barra: "h-2.5", texto: "text-base", anel: "h-20 w-20", fonte: "text-2xl" },
};

export function ConfidenceScore({
  value,
  label = "Confiança",
  size = "md",
  className,
}: ConfidenceScoreProps) {
  const config = tamanhos[size];
  // Usa barra de progresso (mais simples e legível que anel SVG)
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className={cn("flex items-center justify-between", config.texto)}>
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className={cn("font-bold", corTexto(value))}>{Math.round(value)}%</span>
      </div>
      <div className={cn("w-full overflow-hidden rounded-full bg-muted", config.barra)}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", corConfianca(value))}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    </div>
  );
}
