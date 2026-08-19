import { ValueObject } from "../../shared/base/ValueObject";
import { ValidationException } from "../../shared/exceptions/DomainException";

interface AssinaturaDigitalProps {
  medicoId: number;
  assinadoEm: Date;
  hashAssinatura: string;
  certificadoOuNome?: string;
}

export class AssinaturaDigital extends ValueObject<AssinaturaDigitalProps> {
  private constructor(props: AssinaturaDigitalProps) {
    super(props);
  }

  static assinar(medicoId: number, certificadoOuNome?: string): AssinaturaDigital {
    if (!medicoId || medicoId <= 0) {
      throw new ValidationException("ID do médico é obrigatório para assinar o laudo.", "medicoId");
    }

    const agora = new Date();
    const hash = `ASSINADO-DOC-${medicoId}-${agora.getTime()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    return new AssinaturaDigital({
      medicoId,
      assinadoEm: agora,
      hashAssinatura: hash,
      certificadoOuNome: certificadoOuNome?.trim(),
    });
  }

  static reconstituir(props: {
    medicoId: number;
    assinadoEm: Date;
    hashAssinatura: string;
    certificadoOuNome?: string;
  }): AssinaturaDigital {
    return new AssinaturaDigital(props);
  }

  get medicoId(): number {
    return this.props.medicoId;
  }

  get assinadoEm(): Date {
    return this.props.assinadoEm;
  }

  get hash(): string {
    return this.props.hashAssinatura;
  }

  get certificadoOuNome(): string | undefined {
    return this.props.certificadoOuNome;
  }

  equals(other: AssinaturaDigital): boolean {
    return this.hash === other.hash;
  }

  toString(): string {
    return `Assinado por Médico #${this.medicoId} em ${this.assinadoEm.toISOString()} [Hash: ${this.hash}]`;
  }
}
