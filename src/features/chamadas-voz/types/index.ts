export type ChamadaEstado =
  | "A_CHAMAR"
  | "EM_CURSO"
  | "TERMINADA"
  | "REJEITADA"
  | "NAO_ATENDIDA"
  | "CANCELADA";

export interface UtilizadorChamada {
  id: number;
  nome: string;
  role: string;
  ultimoVisto: string | null;
}

export interface ChamadaVoz {
  id: number;
  chamadorId: number;
  receptorId: number;
  conversaId: number | null;
  estado: ChamadaEstado;
  iniciadoEm: string;
  aceiteEm: string | null;
  terminadoEm: string | null;
  duracaoSeg: number;
  motivoFim: string | null;
  chamador: UtilizadorChamada;
  receptor: UtilizadorChamada;
}

export interface SinalVoip {
  id: number;
  chamadaId: number;
  utilizadorId: number;
  tipo: "offer" | "answer" | "ice";
  conteudo: string;
  createdAt: string;
}

export interface ChamadaDTO {
  id: number;
  chamadorId: number;
  receptorId: number;
  conversaId: number | null;
  estado: ChamadaEstado;
  iniciadoEm: string;
  aceiteEm: string | null;
  terminadoEm: string | null;
  duracaoSeg: number;
  motivoFim: string | null;
  chamador: {
    id: number;
    nome: string;
    role: string;
    ultimoVisto: string | null;
  };
  receptor: {
    id: number;
    nome: string;
    role: string;
    ultimoVisto: string | null;
  };
}

/**
 * Item de histórico de chamadas (estilo WhatsApp).
 * A direção é calculada do ponto de vista do utilizador atual.
 */
export interface HistoricochamadaItem {
  id: number;
  outroUtilizadorId: number;
  outroNome: string;
  outroRole: string;
  outroUltimoVisto: string | null;
  estado: ChamadaEstado;
  /** "FEITA" (saída), "RECEBIDA" (entrada) ou "PERDIDA" (missed) */
  direcao: "FEITA" | "RECEBIDA" | "PERDIDA";
  iniciadoEm: string;
  duracaoSeg: number;
  motivoFim: string | null;
}
