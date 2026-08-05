"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { BellRing, CheckCheck, ArrowLeft, Microscope, User } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/format";

interface NotificacaoMedico {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: string;
  lida: boolean;
  utilizadorId: number | null;
  exameId: number | null;
  pacienteId: number | null;
  createdAt: string;
  exame?: {
    id: number;
    codigo: string | null;
    estado: string;
    tipoExame: { nome: string };
    paciente: { nome: string };
  } | null;
  paciente?: { id: number; nome: string } | null;
}

interface Props {
  notificacoes: NotificacaoMedico[];
}

const tipoIcons: Record<string, React.ElementType> = {
  exame_solicitado: Microscope,
  exame_prioridade: Microscope,
  laudo_assinado: CheckCheck,
  mensagem_exame: BellRing,
};

const tipoColors: Record<string, string> = {
  exame_solicitado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  exame_prioridade: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  laudo_assinado: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  mensagem_exame: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

export function NotificacoesMedicoClient({ notificacoes }: Props) {
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
            <BellRing className="h-6 w-6 text-primary" />
            Notificações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {notificacoes.length} notificação(ões) recebida(s)
          </p>
        </div>
      </div>

      {notificacoes.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-muted-foreground">
          <BellRing className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">Nenhuma notificação</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificacoes.map((notif, idx) => {
            const Icon = tipoIcons[notif.tipo] || BellRing;
            const colorClass = tipoColors[notif.tipo] || "bg-muted text-muted-foreground";
            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  "flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors",
                  !notif.lida && "border-primary/30 bg-primary/5"
                )}
              >
                <div className={cn("rounded-lg p-2 shrink-0", colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{notif.titulo}</span>
                    {!notif.lida && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        Nova
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDateTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notif.mensagem}</p>
                  {notif.exame && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Microscope className="h-3.5 w-3.5" />
                        {notif.exame.tipoExame.nome}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {notif.exame.paciente.nome}
                      </span>
                      <Link
                        href={`/medico/exames/${notif.exame.id}`}
                        className="text-primary font-medium hover:underline"
                      >
                        Ver exame →
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}