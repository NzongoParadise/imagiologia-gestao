import { AggregateRoot } from "../../shared/base/AggregateRoot";
import { LaudoId } from "../value-objects/LaudoId";
import { ConteudoLaudo } from "../value-objects/ConteudoLaudo";
import { AssinaturaDigital } from "../value-objects/AssinaturaDigital";
import { ValidationException, BusinessException } from "../../shared/exceptions/DomainException";

export interface LaudoProps {
  exameId: number;
  conteudo: ConteudoLaudo;
  assinado: boolean;
  assinatura?: AssinaturaDigital;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class Laudo extends AggregateRoot<LaudoId> {
  private exameId: number;
  private conteudo: ConteudoLaudo;
  private assinado: boolean;
  private assinatura?: AssinaturaDigital;
  private criadoEm: Date;
  private atualizadoEm: Date;

  private constructor(id: LaudoId, props: LaudoProps) {
    super(id, props);
    this.exameId = props.exameId;
    this.conteudo = props.conteudo;
    this.assinado = props.assinado;
    this.assinatura = props.assinatura;
    this.criadoEm = props.criadoEm;
    this.atualizadoEm = props.atualizadoEm;
  }

  static criarRascunho(props: {
    id?: string | number;
    exameId: number;
    conteudo: string | { tecnica?: string; achados?: string; conclusao?: string };
  }): Laudo {
    if (!props.exameId || props.exameId <= 0) {
      throw new ValidationException("ID do exame é obrigatório.", "exameId");
    }

    const id = props.id ? LaudoId.from(props.id) : LaudoId.create();
    const conteudo = ConteudoLaudo.create(props.conteudo);
    const agora = new Date();

    const laudo = new Laudo(id, {
      exameId: props.exameId,
      conteudo,
      assinado: false,
      criadoEm: agora,
      atualizadoEm: agora,
    });

    laudo.addDomainEvent({
      type: "LaudoCriado",
      aggregateId: id.value,
      timestamp: agora,
      dados: {
        exameId: props.exameId,
        assinado: false,
      },
    });

    return laudo;
  }

  static reconstituir(id: LaudoId, props: LaudoProps): Laudo {
    return new Laudo(id, props);
  }

  atualizarConteudo(novoConteudo: string | { tecnica?: string; achados?: string; conclusao?: string }): void {
    if (this.assinado) {
      throw new BusinessException(
        "Não é possível editar diretamente o conteúdo de um laudo já assinado. Reabra para retificação.",
        "LAUDO_JA_ASSINADO"
      );
    }

    this.conteudo = ConteudoLaudo.create(novoConteudo);
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "LaudoConteudoAtualizado",
      aggregateId: this.id.value,
      timestamp: this.atualizadoEm,
    });
  }

  assinar(medicoId: number, certificadoOuNome?: string): void {
    if (this.assinado && this.assinatura) {
      throw new BusinessException(
        "Este laudo já se encontra assinado.",
        "LAUDO_JA_ASSINADO"
      );
    }

    const assinatura = AssinaturaDigital.assinar(medicoId, certificadoOuNome);
    this.assinatura = assinatura;
    this.assinado = true;
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "LaudoAssinado",
      aggregateId: this.id.value,
      timestamp: this.atualizadoEm,
      medicoId,
      hashAssinatura: assinatura.hash,
    });
  }

  reabrirParaRetificacao(medicoId: number, motivo: string): void {
    if (!this.assinado) {
      throw new BusinessException(
        "Apenas laudos assinados podem ser reabertos para retificação.",
        "LAUDO_NAO_ASSINADO"
      );
    }

    const motivoLimpo = motivo?.trim();
    if (!motivoLimpo || motivoLimpo.length < 5) {
      throw new ValidationException(
        "É obrigatório justificar o motivo da retificação (mínimo 5 caracteres).",
        "motivo"
      );
    }

    this.assinado = false;
    this.assinatura = undefined;
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "LaudoRetificado",
      aggregateId: this.id.value,
      timestamp: this.atualizadoEm,
      medicoId,
      motivo: motivoLimpo,
    });
  }

  // Getters
  getId(): LaudoId {
    return this.id;
  }

  getExameId(): number {
    return this.exameId;
  }

  getConteudo(): ConteudoLaudo {
    return this.conteudo;
  }

  isAssinado(): boolean {
    return this.assinado;
  }

  getAssinatura(): AssinaturaDigital | undefined {
    return this.assinatura;
  }

  getMedicoAssinouId(): number | undefined {
    return this.assinatura?.medicoId;
  }

  getCriadoEm(): Date {
    return this.criadoEm;
  }

  getAtualizadoEm(): Date {
    return this.atualizadoEm;
  }
}
