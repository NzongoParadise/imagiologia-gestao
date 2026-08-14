import type { Atendimento as AtendimentoDB } from "@prisma/client";
import { Atendimento } from "../../../domain/atendimento/entities/Atendimento";
import { AtendimentoId } from "../../../domain/atendimento/value-objects/AtendimentoId";
import { EstadoAtendimento, type EstadoType } from "../../../domain/atendimento/value-objects/EstadoAtendimento";
import { Senha } from "../../../domain/atendimento/value-objects/Senha";

const prioridadeParaNumero = (prioridade: string) =>
  prioridade === "Urgente" ? 3 : prioridade === "Prioridade" ? 2 : 1;

const numeroParaPrioridade = (prioridade: number) =>
  prioridade >= 3 ? "Urgente" : prioridade === 2 ? "Prioridade" : "Normal";

export class AtendimentoMapper {
  static toDomain(raw: AtendimentoDB): Atendimento {
    const tipo = raw.tipo as "CONSULTA" | "URGENCIA";
    const estado = raw.estado === "EM_TRIAGEM" ? "TRIAGEM" : raw.estado;
    return Atendimento.reconstitute(AtendimentoId.from(String(raw.id)), {
      codigo: raw.codigo,
      senha: Senha.create(tipo === "CONSULTA" ? "C" : "U", raw.id),
      tipo,
      pacienteId: raw.pacienteId,
      especialidadeId: raw.especialidadeId ?? 0,
      consultorioId: raw.consultorioId ?? undefined,
      estado: EstadoAtendimento.create(estado as EstadoType),
      prioridade: prioridadeParaNumero(raw.prioridade),
      criadoEm: raw.criadoEm,
      atualizadoEm: raw.atualizadoEm,
    });
  }

  static toPersistence(entity: Atendimento) {
    return {
      codigo: entity.getCodigo(),
      tipo: entity.getTipo(),
      pacienteId: entity.getPacienteId(),
      especialidadeId: entity.getEspecialidadeId() || null,
      consultorioId: entity.getConsultorioId() ?? null,
      estado: entity.getEstado().value === "TRIAGEM" ? "EM_TRIAGEM" : entity.getEstado().value,
      prioridade: numeroParaPrioridade(entity.getPrioridade()),
    };
  }
}
