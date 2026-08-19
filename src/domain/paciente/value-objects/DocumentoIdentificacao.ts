import { ValueObject } from "../../shared/base/ValueObject";

interface DocumentoProps {
  nif?: string;
  bi?: string;
  documentoOutro?: string;
}

export class DocumentoIdentificacao extends ValueObject<DocumentoProps> {
  private constructor(props: DocumentoProps) {
    super(props);
  }

  static create(props: { nif?: string; bi?: string; documentoOutro?: string }): DocumentoIdentificacao {
    return new DocumentoIdentificacao({
      nif: props.nif?.trim().toUpperCase(),
      bi: props.bi?.trim().toUpperCase(),
      documentoOutro: props.documentoOutro?.trim(),
    });
  }

  get nif(): string | undefined {
    return this.props.nif;
  }

  get bi(): string | undefined {
    return this.props.bi;
  }

  get documentoOutro(): string | undefined {
    return this.props.documentoOutro;
  }

  get principal(): string | undefined {
    return this.bi || this.nif || this.documentoOutro;
  }

  equals(other: DocumentoIdentificacao): boolean {
    return (
      this.nif === other.nif &&
      this.bi === other.bi &&
      this.documentoOutro === other.documentoOutro
    );
  }

  toString(): string {
    return this.principal ?? "Sem documento";
  }
}
