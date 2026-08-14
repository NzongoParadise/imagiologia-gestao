import { Atendimento } from "@/domain/atendimento/entities/Atendimento";
import { AtendimentoId } from "@/domain/atendimento/value-objects/AtendimentoId";
import { EstadoAtendimento } from "@/domain/atendimento/value-objects/EstadoAtendimento";
import { Atendimento as PrismaAtendimento } from "@prisma/client";

export class AtendimentoMapper {
  static toDomain(raw: PrismaAtendimento): Atendimento {
    const atendimentoId = AtendimentoId.create(raw.id);
    const estado = EstadoAtendimento.create(raw.estado as any);

    // Esta é uma conversão simplificada. Numa implementação real,
    // teríamos que lidar com todas as propriedades e relações.
    return new Atendimento(atendimentoId, {
      ...raw,
      estado,
      prioridade: raw.prioridade as any,
    });
  }

  static toPersistence(atendimento: Atendimento): PrismaAtendimento {
    return {
      id: atendimento.getId(),
      codigo: atendimento.getCodigo(),
      pacienteId: atendimento.getPacienteId(),
      especialidadeId: atendimento.getEspecialidadeId(),
      estado: atendimento.getEstado().getValue(),
      prioridade: atendimento.getPrioridade(),
      motivo: atendimento.getMotivo() || null,
      consultorioId: atendimento.getConsultorioId() || null,
      criadoEm: atendimento.getCriadoEm(),
      atualizadoEm: atendimento.getAtualizadoEm(),
    };
  }
}