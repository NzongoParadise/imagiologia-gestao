import { ValueObject } from "../../shared/base/ValueObject";

/**
 * Senha - Value Object for ticket number (C-001, U-001, etc)
 */
interface SenhaProps {
  value: string;
}

export class Senha extends ValueObject<SenhaProps> {
  private constructor(senha: string) {
    super({ value: senha });
  }

  /**
   * Validar formato: tipo-numero (ex: C-0001, U-0001, E-0001)
   */
  private static validarFormato(senha: string): boolean {
    const regex = /^[A-Z]-\d{4}$/;
    return regex.test(senha);
  }

  /**
   * Criar nova Senha
   */
  static create(tipo: "C" | "U" | "E", numero: number): Senha {
    const senhaFormatted = `${tipo}-${String(numero).padStart(4, "0")}`;
    return new Senha(senhaFormatted);
  }

  /**
   * Criar a partir de valor existente
   */
  static from(senha: string): Senha {
    if (!this.validarFormato(senha)) {
      throw new Error(`Formato de senha inválido: ${senha}. Use: A-0001`);
    }
    return new Senha(senha);
  }

  get value(): string {
    return this.props.value;
  }

  get tipo(): "C" | "U" | "E" {
    return this.value[0] as "C" | "U" | "E";
  }

  get numero(): number {
    return parseInt(this.value.split("-")[1], 10);
  }

  equals(other: Senha): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
