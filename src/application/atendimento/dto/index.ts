/**
 * CriarAtendimentoRequest - Input DTO
 */
export interface CriarAtendimentoRequest {
  pacienteId: number;
  especialidadeId: number;
  tipo: "CONSULTA" | "URGENCIA";
  prioridade: number;
}

/**
 * AtendimentoResponse - Output DTO
 */
export interface AtendimentoResponse {
  id: string;
  codigo: string;
  senha: string;
  tipo: "CONSULTA" | "URGENCIA";
  pacienteId: number;
  especialidadeId: number;
  estado: string;
  prioridade: number;
  criadoEm: string;
}

/**
 * Map Atendimento domain entity to response DTO
 */
export function mapAtendimentoToResponse(atendimento: any): AtendimentoResponse {
  return {
    id: atendimento.getId().value,
    codigo: atendimento.getCodigo(),
    senha: atendimento.getSenha().toString(),
    tipo: atendimento.getTipo(),
    pacienteId: atendimento.getPacienteId(),
    especialidadeId: atendimento.getEspecialidadeId(),
    estado: atendimento.getEstado().toString(),
    prioridade: atendimento.getPrioridade(),
    criadoEm: atendimento.getCriadoEm().toISOString(),
  };
}
