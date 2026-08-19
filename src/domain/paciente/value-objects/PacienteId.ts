import { ValueObject } from "../../shared/base/ValueObject";

interface PacienteIdProps {
  value: string;
}

export class PacienteId extends ValueObject<PacienteIdProps> {
  private constructor(id: string) {
    super({ value: id });
  }

  static create(): PacienteId {
    return new PacienteId(crypto.randomUUID());
  }

  static from(id: string | number): PacienteId {
    const stringId = String(id).trim();
    if (!stringId) {
      throw new Error("PacienteId não pode ser vazio.");
    }
    return new PacienteId(stringId);
  }

  get value(): string {
    return this.props.value;
  }

  toNumber(): number {
    const num = Number(this.props.value);
    if (!Number.isInteger(num)) {
      throw new Error(`PacienteId ${this.props.value} não é um identificador numérico válido.`);
    }
    return num;
  }

  equals(other: PacienteId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
