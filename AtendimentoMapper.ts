import { Atendimento } from "@/domain/atendimento/entities/Atendimento";
import { AtendimentoId } from "@/domain/atendimento/value-objects/AtendimentoId";
import { EstadoAtendimento } from "@/domain/atendimento/value-objects/EstadoAtendimento";
import {
  Atendimento as PrismaAtendimento,
  EstadoAtendimento as PrismaEstado,
  PrioridadeAtendimento as PrismaPrioridade,
} from "@prisma/client";

function toDomainEstado(estado: PrismaEstado): EstadoAtendimento {
  // Esta função garante que o estado vindo da base de dados é válido
  // para o nosso domínio. Lança um erro se for um valor inesperado.
  return EstadoAtendimento.create(estado);
}

function toDomainPrioridade(
  prioridade: PrismaPrioridade
): PrismaPrioridade {
  // Validação semelhante para a prioridade
  const prioridadesValidas: PrismaPrioridade[] = ["Normal", "Baixa", "Alta", "Urgente"];
  if (!prioridadesValidas.includes(prioridade)) {
    throw new Error(`Prioridade inválida vinda da base de dados: ${prioridade}`);
  }
  return prioridade;
}

export class AtendimentoMapper {
  static toDomain(raw: PrismaAtendimento): Atendimento {
    const atendimentoId = AtendimentoId.create(String(raw.id)); // Corrigido: Converte número para string

    // Esta é uma conversão simplificada. Numa implementação real,
    // teríamos que lidar com todas as propriedades e relações.
    return new Atendimento(atendimentoId, {
      ...raw,
      estado: toDomainEstado(raw.estado),
      prioridade: toDomainPrioridade(raw.prioridade),
    });
  }

  static toPersistence(atendimento: Atendimento): PrismaAtendimento {
    return {
      id: Number(atendimento.getId().getValue()),
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