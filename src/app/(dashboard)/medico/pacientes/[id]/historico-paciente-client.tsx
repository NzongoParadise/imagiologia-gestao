"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, User, Microscope, FileSignature, Image as ImageIcon, CalendarDays } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDate, formatDateTime } from "@/utils/format";
import type { HistoricoPacienteMedico } from "@/features/medico/types";
import { estadoColors, prioridadeColors } from "@/features/medico/constants";

interface Props {
  paciente: HistoricoPacienteMedico;
}

export function HistoricoPacienteClient({ paciente }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link
          href="/medico"
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            {paciente.nome}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Processo #{paciente.numeroProcesso} · {paciente.exames.length} exame(s)
          </p>
        </div>
      </div>

      {/* Dados do paciente */}
      <div className="rounded-xl border bg-card p-5">
        <h2 className="text-sm font-semibold mb-4">Dados do Paciente</h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Data de Nascimento</dt>
            <dd className="text-sm mt-1">{formatDate(paciente.dataNascimento)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Sexo</dt>
            <dd className="text-sm mt-1">{paciente.sexo || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Telefone</dt>
            <dd className="text-sm mt-1">{paciente.telefone || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Email</dt>
            <dd className="text-sm mt-1">{paciente.email || "-"}</dd>
          </div>
        </dl>
      </div>

      {/* Histórico de exames */}
      <div className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="text-sm font-semibold">Exames Anteriores</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {paciente.exames.length} exame(s) realizados por este paciente
          </p>
        </div>

        {paciente.exames.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-muted-foreground">
            <Microscope className="h-12 w-12 mb-3" />
            <p className="text-sm">Nenhum exame registado para este paciente</p>
          </div>
        ) : (
          <div className="divide-y">
            {paciente.exames.map((exame) => (
              <div key={exame.id} className="p-5 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">
                        {exame.tipoExame?.nome || "Exame"}
                      </span>
                      {exame.codigo && (
                        <span className="text-xs text-muted-foreground">({exame.codigo})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                        estadoColors[exame.estado] || "bg-muted text-muted-foreground"
                      )}>
                        {exame.estado}
                      </span>
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                        prioridadeColors[exame.prioridade] || "bg-muted text-muted-foreground"
                      )}>
                        {exame.prioridade}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDateTime(exame.dataExame)}
                    </div>
                  </div>
                </div>

                {exame.diagnosticoClinico && (
                  <p className="text-sm text-muted-foreground mt-3">
                    <span className="font-medium text-foreground">Diagnóstico:</span>{" "}
                    {exame.diagnosticoClinico}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-3 flex-wrap">
                  {exame.laudos && exame.laudos.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileSignature className="h-3.5 w-3.5" />
                      {exame.laudos[0].assinado ? "Laudo assinado" : "Laudo em elaboração"}
                    </span>
                  )}
                  {exame._count && exame._count.imagens > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {exame._count.imagens} imagem(ns)
                    </span>
                  )}
                  <Link
                    href={`/medico/exames/${exame.id}`}
                    className="text-xs font-medium text-primary hover:underline ml-auto"
                  >
                    Ver detalhes →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}