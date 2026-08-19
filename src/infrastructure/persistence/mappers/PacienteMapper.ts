import type { Paciente as PacienteDB } from "@prisma/client";
import { Paciente } from "../../../domain/paciente/entities/Paciente";
import { PacienteId } from "../../../domain/paciente/value-objects/PacienteId";
import { NumeroProcesso } from "../../../domain/paciente/value-objects/NumeroProcesso";
import { Contacto } from "../../../domain/paciente/value-objects/Contacto";
import { DocumentoIdentificacao } from "../../../domain/paciente/value-objects/DocumentoIdentificacao";

export class PacienteMapper {
  static toDomain(raw: PacienteDB): Paciente {
    return Paciente.reconstituir(PacienteId.from(String(raw.id)), {
      numeroProcesso: NumeroProcesso.create(raw.numeroProcesso),
      nome: raw.nome,
      dataNascimento: raw.dataNascimento ?? undefined,
      sexo: raw.sexo ?? undefined,
      contacto: Contacto.create({
        telefone: raw.telefone ?? undefined,
        email: raw.email ?? undefined,
      }),
      documento: DocumentoIdentificacao.create({
        nif: raw.nif ?? undefined,
        bi: raw.bi ?? undefined,
        documentoOutro: raw.documento ?? undefined,
      }),
      endereco: raw.endereco ?? undefined,
      foto: raw.foto ?? undefined,
      observacoes: raw.observacoes ?? undefined,
      criadoEm: raw.createdAt,
      atualizadoEm: raw.updatedAt,
    });
  }

  static toPersistence(entity: Paciente) {
    return {
      numeroProcesso: entity.getNumeroProcesso().value,
      nome: entity.getNome(),
      dataNascimento: entity.getDataNascimento() ?? null,
      sexo: entity.getSexo() ?? null,
      telefone: entity.getContacto().telefone ?? null,
      email: entity.getContacto().email ?? null,
      nif: entity.getDocumento().nif ?? null,
      bi: entity.getDocumento().bi ?? null,
      documento: entity.getDocumento().documentoOutro ?? null,
      endereco: entity.getEndereco() ?? null,
      foto: entity.getFoto() ?? null,
      observacoes: entity.getObservacoes() ?? null,
    };
  }
}
