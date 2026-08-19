import { Exame } from "../../../domain/exame";

export interface SolicitarExameRequest {
  codigo?: string;
  modalidade?: string;
  pacienteId: number;
  tipoExameId: number;
  tecnicoId?: number;
  procedenciaId?: number;
  medicoSolicitante?: string;
  observacao?: string;
  diagnosticoClinico?: string;
  justificacaoClinica?: string;
  prioridade?: string | number;
  dataExame?: string | Date;
}

export interface AtualizarEstadoExameRequest {
  id: string | number;
  acao: "INICIAR" | "CONCLUIR" | "LAUDAR" | "CANCELAR";
  tecnicoId?: number;
  laudoId?: string | number;
  motivo?: string;
}

export interface ExameResponse {
  id: string;
  codigo: string;
  pacienteId: number;
  tipoExameId: number;
  tecnicoId?: number;
  procedenciaId?: number;
  medicoSolicitante?: string;
  observacao?: string;
  diagnosticoClinico?: string;
  justificacaoClinica?: string;
  estado: string;
  prioridade: string;
  prioridadeNivel: number;
  dataExame: string;
  criadoEm: string;
  atualizadoEm: string;
}

export function mapExameToResponse(exame: Exame): ExameResponse {
  return {
    id: exame.getId().value,
    codigo: exame.getCodigo().value,
    pacienteId: exame.getPacienteId(),
    tipoExameId: exame.getTipoExameId(),
    tecnicoId: exame.getTecnicoId(),
    procedenciaId: exame.getProcedenciaId(),
    medicoSolicitante: exame.getMedicoSolicitante(),
    observacao: exame.getObservacao(),
    diagnosticoClinico: exame.getDiagnosticoClinico(),
    justificacaoClinica: exame.getJustificacaoClinica(),
    estado: exame.getEstado().value,
    prioridade: exame.getPrioridade().valor,
    prioridadeNivel: exame.getPrioridade().nivel,
    dataExame: exame.getDataExame().toISOString(),
    criadoEm: exame.getCriadoEm().toISOString(),
    atualizadoEm: exame.getAtualizadoEm().toISOString(),
  };
}
