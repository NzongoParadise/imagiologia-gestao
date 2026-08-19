import type { Exame as ExameDB } from "@prisma/client";
import { Exame } from "../../../domain/exame/entities/Exame";
import { ExameId } from "../../../domain/exame/value-objects/ExameId";
import { CodigoExame } from "../../../domain/exame/value-objects/CodigoExame";
import { EstadoExame } from "../../../domain/exame/value-objects/EstadoExame";
import { PrioridadeExame } from "../../../domain/exame/value-objects/PrioridadeExame";

export class ExameMapper {
  static toDomain(raw: ExameDB): Exame {
    const codigo = raw.codigo
      ? CodigoExame.create(raw.codigo)
      : CodigoExame.gerarAutomatico("EX");

    return Exame.reconstituir(ExameId.from(String(raw.id)), {
      codigo,
      pacienteId: raw.pacienteId,
      tipoExameId: raw.tipoExameId,
      tecnicoId: raw.tecnicoId ?? undefined,
      procedenciaId: raw.procedenciaId ?? undefined,
      medicoSolicitante: raw.medicoSolicitante ?? undefined,
      observacao: raw.observacao ?? undefined,
      diagnosticoClinico: raw.diagnosticoClinico ?? undefined,
      justificacaoClinica: raw.justificacaoClinica ?? undefined,
      estado: EstadoExame.from(raw.estado),
      prioridade: PrioridadeExame.from(raw.prioridade),
      dataExame: raw.dataExame,
      criadoEm: raw.createdAt,
      atualizadoEm: raw.updatedAt,
    });
  }

  static toPersistence(entity: Exame) {
    return {
      codigo: entity.getCodigo().value,
      pacienteId: entity.getPacienteId(),
      tipoExameId: entity.getTipoExameId(),
      tecnicoId: entity.getTecnicoId() ?? null,
      procedenciaId: entity.getProcedenciaId() ?? null,
      medicoSolicitante: entity.getMedicoSolicitante() ?? null,
      observacao: entity.getObservacao() ?? null,
      diagnosticoClinico: entity.getDiagnosticoClinico() ?? null,
      justificacaoClinica: entity.getJustificacaoClinica() ?? null,
      estado: entity.getEstado().toDbLabel(),
      prioridade: entity.getPrioridade().toDbLabel(),
      dataExame: entity.getDataExame(),
    };
  }
}
