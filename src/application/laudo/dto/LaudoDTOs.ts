import { Laudo } from "../../../domain/laudo";

export interface CriarLaudoRequest {
  exameId: number;
  conteudo: string | {
    tecnica?: string;
    achados?: string;
    conclusao?: string;
  };
}

export interface AssinarLaudoRequest {
  id: string | number;
  medicoId: number;
  certificadoOuNome?: string;
}

export interface LaudoResponse {
  id: string;
  exameId: number;
  conteudo: string;
  tecnica?: string;
  achados?: string;
  conclusao?: string;
  assinado: boolean;
  medicoAssinouId?: number;
  assinaturaHash?: string;
  assinadoEm?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export function mapLaudoToResponse(laudo: Laudo): LaudoResponse {
  const assinatura = laudo.getAssinatura();
  const conteudoVo = laudo.getConteudo();

  return {
    id: laudo.getId().value,
    exameId: laudo.getExameId(),
    conteudo: conteudoVo.texto,
    tecnica: conteudoVo.tecnica,
    achados: conteudoVo.achados,
    conclusao: conteudoVo.conclusao,
    assinado: laudo.isAssinado(),
    medicoAssinouId: laudo.getMedicoAssinouId(),
    assinaturaHash: assinatura?.hash,
    assinadoEm: assinatura?.assinadoEm.toISOString(),
    criadoEm: laudo.getCriadoEm().toISOString(),
    atualizadoEm: laudo.getAtualizadoEm().toISOString(),
  };
}
