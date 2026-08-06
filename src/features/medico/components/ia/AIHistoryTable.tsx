"use client";

import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { History, Clock, User } from "lucide-react";
import { formatDateTime } from "@/utils/format";
import type { AnaliseIA } from "@/features/medico/types/ia";

interface AIHistoryTableProps {
  analises: AnaliseIA[];
  selectedId?: number;
  onSelect?: (analise: AnaliseIA) => void;
  className?: string;
}

export function AIHistoryTable({
  analises,
  selectedId,
  onSelect,
  className,
}: AIHistoryTableProps) {
  const ordenadas = useMemo(
    () => [...analises].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [analises]
  );

  return (
    <div className={cn("overflow-hidden rounded-xl border bg-card", className)}>
      <div className="flex items-center justify-between border-b px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4 text-primary" />
          Histórico de Análises de IA
        </h2>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {ordenadas.length} análise(s)
        </span>
      </div>

      {ordenadas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <History className="h-8 w-8 mb-2 opacity-30" />
          <p className="text-sm">Nenhuma análise de IA registada.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Diagnóstico</th>
                <th className="px-4 py-3 text-center font-medium">Conf.</th>
                <th className="px-4 py-3 text-left font-medium">Modelo</th>
                <th className="px-4 py-3 text-left font-medium">Data</th>
                <th className="px-4 py-3 text-center font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {ordenadas.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => onSelect?.(a)}
                  className={cn(
                    "border-b last:border-0 transition-colors",
                    onSelect ? "cursor-pointer hover:bg-muted/30" : "",
                    selectedId === a.id && "bg-primary/5"
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.diagnosticoPrincipal || "-"}</p>
                    {a.utilizador && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        {a.utilizador.nome}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        a.confianca >= 75
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : a.confianca >= 50
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      )}
                    >
                      {Math.round(a.confianca)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.modelo}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(a.createdAt)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize">
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
