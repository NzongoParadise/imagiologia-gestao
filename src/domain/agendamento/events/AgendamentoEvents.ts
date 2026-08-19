export interface AgendamentoCriadoEvent {
  type: "AgendamentoCriado";
  aggregateId: string;
  timestamp: Date;
  dados: {
    pacienteId: number;
    dataHora: Date;
    duracaoMin: number;
    medicoId?: number;
    especialidadeId?: number;
    consultorioId?: number;
  };
}

export interface AgendamentoConfirmadoEvent {
  type: "AgendamentoConfirmado";
  aggregateId: string;
  timestamp: Date;
}

export interface PacienteChegouEvent {
  type: "PacienteChegou";
  aggregateId: string;
  timestamp: Date;
}

export interface AgendamentoConcluidoEvent {
  type: "AgendamentoConcluido";
  aggregateId: string;
  timestamp: Date;
  atendimentoId?: number;
}

export interface AgendamentoCanceladoEvent {
  type: "AgendamentoCancelado";
  aggregateId: string;
  timestamp: Date;
  motivo?: string;
}

export interface AgendamentoReagendadoEvent {
  type: "AgendamentoReagendado";
  aggregateId: string;
  timestamp: Date;
  novoInicio: Date;
  novaDuracao: number;
}
