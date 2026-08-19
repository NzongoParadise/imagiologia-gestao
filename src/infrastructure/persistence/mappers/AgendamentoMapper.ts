import type { AgendamentoConsulta as AgendamentoDB } from "@prisma/client";
import { Agendamento } from "../../../domain/agendamento/entities/Agendamento";
import { AgendamentoId } from "../../../domain/agendamento/value-objects/AgendamentoId";
import { EstadoAgendamento } from "../../../domain/agendamento/value-objects/EstadoAgendamento";
import { SlotHorario } from "../../../domain/agendamento/value-objects/SlotHorario";

export class AgendamentoMapper {
  static toDomain(raw: AgendamentoDB): Agendamento {
    return Agendamento.reconstituir(AgendamentoId.from(String(raw.id)), {
      pacienteId: raw.pacienteId,
      atendimentoId: raw.atendimentoId ?? undefined,
      especialidadeId: raw.especialidadeId ?? undefined,
      consultorioId: raw.consultorioId ?? undefined,
      medicoId: raw.medicoId ?? undefined,
      slot: SlotHorario.create(raw.dataHora, raw.duracaoMin),
      estado: EstadoAgendamento.from(raw.estado),
      observacoes: raw.observacoes ?? undefined,
      criadoPorId: raw.criadoPorId ?? undefined,
      criadoEm: raw.criadoEm,
    });
  }

  static toPersistence(entity: Agendamento) {
    const slot = entity.getSlot();
    return {
      pacienteId: entity.getPacienteId(),
      atendimentoId: entity.getAtendimentoId() ?? null,
      especialidadeId: entity.getEspecialidadeId() ?? null,
      consultorioId: entity.getConsultorioId() ?? null,
      medicoId: entity.getMedicoId() ?? null,
      dataHora: slot.inicio,
      duracaoMin: slot.duracaoMin,
      estado: entity.getEstado().toDbLabel(),
      observacoes: entity.getObservacoes() ?? null,
      criadoPorId: entity.getCriadoPorId() ?? null,
    };
  }
}
