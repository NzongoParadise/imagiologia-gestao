// Constantes do Portal do Médico

export const ESTADOS_PORTAL = [
  "Solicitado",
  "Agendado",
  "Paciente Confirmado",
  "Exame Realizado",
  "Laudo em Elaboração",
  "Laudo Assinado",
  "Concluído",
] as const;

export const PRIORIDADES = [
  "Normal",
  "Prioritário",
  "Urgente",
  "Emergência",
] as const;

export const estadoColors: Record<string, string> = {
  Solicitado: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Agendado: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Paciente Confirmado": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  "Exame Realizado": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "Laudo em Elaboração": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Laudo Assinado": "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  Concluído: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  Pendente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export const prioridadeColors: Record<string, string> = {
  Normal: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Prioritário: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Urgente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  Emergência: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

