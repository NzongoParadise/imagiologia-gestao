export const ESTADO_ATENDIMENTO = {
  AGUARDANDO: {
    label: "Aguardando",
    cor: "warning",
    icon: "Clock",
    descricao: "Paciente aguardando consulta",
  },
  EM_TRIAGEM: {
    label: "Em triagem",
    cor: "info",
    icon: "CheckCircle2",
    descricao: "Paciente sendo triado",
  },
  EM_ATENDIMENTO: {
    label: "Em atendimento",
    cor: "default",
    icon: "Activity",
    descricao: "Paciente sendo atendido",
  },
  CONCLUIDO: {
    label: "Concluído",
    cor: "success",
    icon: "CheckCircle2",
    descricao: "Atendimento concluído",
  },
  CANCELADO: {
    label: "Cancelado",
    cor: "destructive",
    icon: "X",
    descricao: "Atendimento cancelado",
  },
  ENCAMINHADO: {
    label: "Encaminhado",
    cor: "secondary",
    icon: "ArrowRightLeft",
    descricao: "Paciente encaminhado",
  },
} as const;

export const MOTIVOS_CANCELAMENTO = [
  { value: "nao_compareceu", label: "Não compareceu" },
  { value: "solicitacao_paciente", label: "Solicitação do paciente" },
  { value: "medico_indisponivel", label: "Médico indisponível" },
  { value: "erro_administrativo", label: "Erro administrativo" },
  { value: "outro", label: "Outro" },
] as const;

export type EstadoAtendimento = keyof typeof ESTADO_ATENDIMENTO;
export type MotivoCancelamento = typeof MOTIVOS_CANCELAMENTO[number]["value"];