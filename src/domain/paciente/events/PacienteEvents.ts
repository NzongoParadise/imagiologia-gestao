export interface PacienteRegistadoEvent {
  type: "PacienteRegistado";
  aggregateId: string;
  timestamp: Date;
  dados: {
    nome: string;
    numeroProcesso: string;
    telefone?: string;
    email?: string;
  };
}

export interface PacienteAtualizadoEvent {
  type: "PacienteAtualizado";
  aggregateId: string;
  timestamp: Date;
  alteracoes: Record<string, unknown>;
}

export interface PacienteObservacaoAdicionadaEvent {
  type: "PacienteObservacaoAdicionada";
  aggregateId: string;
  timestamp: Date;
  observacao: string;
}
