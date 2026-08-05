"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, Microscope, User, ArrowLeft } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";
import type { AgendaMedico } from "@/features/medico/types";
import { estadoColors, prioridadeColors } from "@/features/medico/constants";

interface Props {
  agenda: AgendaMedico;
}

export function AgendaMedicoClient({ agenda }: Props) {
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
            <Calendar className="h-6 w-6 text-primary" />
            Agenda
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Exames de hoje, próximos exames e agenda da equipa.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Exames de hoje */}
        <div className="rounded-xl border bg-card">
          <div className="border-b p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Exames de Hoje
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {agenda.examesHoje.length} exame(s) agendado(s) para hoje
            </p>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {agenda.examesHoje.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Nenhum exame agendado para hoje.</p>
              </div>
            ) : (
              agenda.examesHoje.map((exame) => (
                <div key={exame.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <Link href={`/medico/exames/${exame.id}`} className="text-sm font-medium text-primary hover:underline">
                          {exame.paciente?.nome || "Paciente"}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {exame.tipoExame?.nome || "Exame"}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", estadoColors[exame.estado] || "bg-muted")}>
                            {exame.estado}
                          </span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", prioridadeColors[exame.prioridade] || "bg-muted")}>
                            {exame.prioridade}
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(exame.dataExame)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Próximos exames */}
        <div className="rounded-xl border bg-card">
          <div className="border-b p-5">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Microscope className="h-4 w-4 text-primary" />
              Próximos Exames
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {agenda.proximosExames.length} exame(s) agendado(s)
            </p>
          </div>
          <div className="divide-y max-h-96 overflow-y-auto">
            {agenda.proximosExames.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
                <Microscope className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Nenhum próximo exame agendado.</p>
              </div>
            ) : (
              agenda.proximosExames.map((exame) => (
                <div key={exame.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{exame.paciente?.nome || "Paciente"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {exame.tipoExame?.nome || "Exame"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(exame.dataExame)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Consultas / Turnos */}
      <div className="rounded-xl border bg-card">
        <div className="border-b p-5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Turnos de Hoje
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {agenda.consultas.length} turno(s) marcado(s)
          </p>
        </div>
        <div className="divide-y">
          {agenda.consultas.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">Nenhum turno marcado para hoje.</p>
            </div>
          ) : (
            agenda.consultas.map((turno) => (
              <div key={turno.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{turno.tecnico?.nome || "Técnico"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {turno.tecnico?.especialidade || "Especialidade não definida"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {turno.horaInicio} - {turno.horaFim}
                    </p>
                    <p className="text-xs text-muted-foreground">{turno.estado}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
