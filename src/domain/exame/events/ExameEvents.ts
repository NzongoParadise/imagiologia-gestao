export interface ExameSolicitadoEvent {
  type: "ExameSolicitado";
  aggregateId: string;
  timestamp: Date;
  dados: {
    codigo: string;
    pacienteId: number;
    tipoExameId: number;
    prioridade: string;
  };
}

export interface ExameIniciadoEvent {
  type: "ExameIniciado";
  aggregateId: string;
  timestamp: Date;
  tecnicoId?: number;
}

export interface ExameRealizadoEvent {
  type: "ExameRealizado";
  aggregateId: string;
  timestamp: Date;
  tecnicoId?: number;
}

export interface ExameLaudadoEvent {
  type: "ExameLaudado";
  aggregateId: string;
  timestamp: Date;
  laudoId: number | string;
}

export interface ExameCanceladoEvent {
  type: "ExameCancelado";
  aggregateId: string;
  timestamp: Date;
  motivo?: string;
}
