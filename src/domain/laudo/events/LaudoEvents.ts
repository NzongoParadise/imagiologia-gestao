export interface LaudoCriadoEvent {
  type: "LaudoCriado";
  aggregateId: string;
  timestamp: Date;
  dados: {
    exameId: number;
    assinado: boolean;
  };
}

export interface LaudoConteudoAtualizadoEvent {
  type: "LaudoConteudoAtualizado";
  aggregateId: string;
  timestamp: Date;
}

export interface LaudoAssinadoEvent {
  type: "LaudoAssinado";
  aggregateId: string;
  timestamp: Date;
  medicoId: number;
  hashAssinatura: string;
}

export interface LaudoRetificadoEvent {
  type: "LaudoRetificado";
  aggregateId: string;
  timestamp: Date;
  medicoId: number;
  motivo: string;
}
