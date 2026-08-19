import type { Laudo as LaudoDB } from "@prisma/client";
import { Laudo } from "../../../domain/laudo/entities/Laudo";
import { LaudoId } from "../../../domain/laudo/value-objects/LaudoId";
import { ConteudoLaudo } from "../../../domain/laudo/value-objects/ConteudoLaudo";
import { AssinaturaDigital } from "../../../domain/laudo/value-objects/AssinaturaDigital";

export class LaudoMapper {
  static toDomain(raw: LaudoDB): Laudo {
    const conteudo = ConteudoLaudo.create(raw.conteudo);

    let assinatura: AssinaturaDigital | undefined = undefined;
    if (raw.assinado && raw.medicoAssinouId && raw.assinadoEm) {
      assinatura = AssinaturaDigital.reconstituir({
        medicoId: raw.medicoAssinouId,
        assinadoEm: raw.assinadoEm,
        hashAssinatura: raw.assinatura || `ASS-${raw.medicoAssinouId}-${raw.id}`,
      });
    }

    return Laudo.reconstituir(LaudoId.from(String(raw.id)), {
      exameId: raw.exameId,
      conteudo,
      assinado: raw.assinado,
      assinatura,
      criadoEm: raw.createdAt,
      atualizadoEm: raw.updatedAt,
    });
  }

  static toPersistence(entity: Laudo) {
    const assinatura = entity.getAssinatura();
    return {
      exameId: entity.getExameId(),
      conteudo: entity.getConteudo().texto,
      assinado: entity.isAssinado(),
      medicoAssinouId: entity.getMedicoAssinouId() ?? null,
      assinatura: assinatura?.hash ?? null,
      assinadoEm: assinatura?.assinadoEm ?? null,
    };
  }
}
