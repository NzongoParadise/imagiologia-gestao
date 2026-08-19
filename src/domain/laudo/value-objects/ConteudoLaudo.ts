import { ValueObject } from "../../shared/base/ValueObject";
import { ValidationException } from "../../shared/exceptions/DomainException";

interface ConteudoLaudoProps {
  textoCompleto: string;
  tecnica?: string;
  achados?: string;
  conclusao?: string;
}

export class ConteudoLaudo extends ValueObject<ConteudoLaudoProps> {
  private constructor(props: ConteudoLaudoProps) {
    super(props);
  }

  static create(textoOuEstrutura: string | { tecnica?: string; achados?: string; conclusao?: string }): ConteudoLaudo {
    if (typeof textoOuEstrutura === "string") {
      const limpo = textoOuEstrutura.trim();
      if (!limpo || limpo.length < 5) {
        throw new ValidationException(
          "O conteúdo do laudo deve ter no mínimo 5 caracteres.",
          "conteudo"
        );
      }
      return new ConteudoLaudo({ textoCompleto: limpo });
    }

    const { tecnica, achados, conclusao } = textoOuEstrutura;
    const partes: string[] = [];
    if (tecnica?.trim()) partes.push(`TÉCNICA:\n${tecnica.trim()}`);
    if (achados?.trim()) partes.push(`ACHADOS:\n${achados.trim()}`);
    if (conclusao?.trim()) partes.push(`CONCLUSÃO / IMPRESSÃO DIAGNÓSTICA:\n${conclusao.trim()}`);

    const textoCompleto = partes.join("\n\n").trim();
    if (!textoCompleto || textoCompleto.length < 5) {
      throw new ValidationException(
        "O laudo estruturado deve conter pelo menos uma secção preenchida com conteúdo válido.",
        "conteudo"
      );
    }

    return new ConteudoLaudo({
      textoCompleto,
      tecnica: tecnica?.trim(),
      achados: achados?.trim(),
      conclusao: conclusao?.trim(),
    });
  }

  get texto(): string {
    return this.props.textoCompleto;
  }

  get tecnica(): string | undefined {
    return this.props.tecnica;
  }

  get achados(): string | undefined {
    return this.props.achados;
  }

  get conclusao(): string | undefined {
    return this.props.conclusao;
  }

  equals(other: ConteudoLaudo): boolean {
    return this.texto === other.texto;
  }

  toString(): string {
    return this.texto;
  }
}
