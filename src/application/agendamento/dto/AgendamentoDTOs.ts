import { Agendamento } from "../../../domain/agendamento";

export interface CriarAgendamentoRequest {
  pacienteId: number;
  atendimentoId?: number;
  especialidadeId?: number;
  consultorioId?: number;
  medicoId?: number;
  dataHora: string | Date;
  duracaoMin?: number;
  observacoes?: string;
  criadoPorId?: number;
}

export interface AgendamentoResponse {
  id: string;
  pacienteId: number;
  atendimentoId?: number;
  especialidadeId?: number;
  consultorioId?: number;
  medicoId?: number;
  dataHora: string;
  dataFim: string;
  duracaoMin: number;
  estado: string;
  observacoes?: string;
  criadoPorId?: number;
  criadoEm: string;
}

export function mapAgendamentoToResponse(agendamento: Agendamento): AgendamentoResponse {
  const slot = agendamento.getSlot();
  return {
    id: agendamento.getId().value,
    pacienteId: agendamento.getPacienteId(),
    atendimentoId: agendamento.getAtendimentoId(),
    especialidadeId: agendamento.getEspecialidadeId(),
    consultorioId: agendamento.getConsultorioId(),
    medicoId: agendamento.getMedicoId(),
    dataHora: slot.inicio.toISOString(),
    dataFim: slot.fim.toISOString(),
    duracaoMin: slot.duracaoMin,
    estado: agendamento.getEstado().value,
    observacoes: agendamento.getObservacoes(),
    criadoPorId: agendamento.getCriadoPorId(),
    criadoEm: agendamento.getCriadoEm().toISOString(),
  };
}
