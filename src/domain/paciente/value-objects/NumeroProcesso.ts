import { ValueObject } from "../../shared/base/ValueObject";
import { ValidationException } from "../../shared/exceptions/DomainException";

interface NumeroProcessoProps {
  value: string;
}

export class NumeroProcesso extends ValueObject<NumeroProcessoProps> {
  private constructor(numero: string) {
    super({ value: numero });
  }

  static create(numero: string): NumeroProcesso {
    const limpo = numero.trim();
    if (!limpo || limpo.length < 3) {
      throw new ValidationException(
        "Número de processo inválido: deve ter pelo menos 3 caracteres.",
        "numeroProcesso"
      );
    }
    return new NumeroProcesso(limpo);
  }

  static gerarAutomatico(): NumeroProcesso {
    const ano = new Date().getFullYear();
    const aleatorio = Math.floor(1000 + Math.random() * 9000);
    return new NumeroProcesso(`PROC-${ano}-${aleatorio}`);
  }

  get value(): string {
    return this.props.value;
  }

  equals(other: NumeroProcesso): boolean {
    return this.value.toUpperCase() === other.value.toUpperCase();
  }

  toString(): string {
    return this.value;
  }
}
