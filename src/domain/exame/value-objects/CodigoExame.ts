import { ValueObject } from "../../shared/base/ValueObject";
import { ValidationException } from "../../shared/exceptions/DomainException";

interface CodigoExameProps {
  value: string;
}

export class CodigoExame extends ValueObject<CodigoExameProps> {
  private constructor(codigo: string) {
    super({ value: codigo });
  }

  static create(codigo: string): CodigoExame {
    const limpo = codigo.trim();
    if (!limpo || limpo.length < 3) {
      throw new ValidationException(
        "Código de exame inválido: deve ter pelo menos 3 caracteres.",
        "codigo"
      );
    }
    return new CodigoExame(limpo);
  }

  static gerarAutomatico(modalidade: string = "RX"): CodigoExame {
    const ano = new Date().getFullYear();
    const mod = modalidade.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "EX";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return new CodigoExame(`${mod}-${ano}-${randomNum}`);
  }

  get value(): string {
    return this.props.value;
  }

  equals(other: CodigoExame): boolean {
    return this.value.toUpperCase() === other.value.toUpperCase();
  }

  toString(): string {
    return this.value;
  }
}
