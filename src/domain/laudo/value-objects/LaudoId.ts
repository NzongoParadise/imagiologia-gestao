import { ValueObject } from "../../shared/base/ValueObject";

interface LaudoIdProps {
  value: string;
}

export class LaudoId extends ValueObject<LaudoIdProps> {
  private constructor(id: string) {
    super({ value: id });
  }

  static create(): LaudoId {
    return new LaudoId(crypto.randomUUID());
  }

  static from(id: string | number): LaudoId {
    const stringId = String(id).trim();
    if (!stringId) {
      throw new Error("LaudoId não pode ser vazio.");
    }
    return new LaudoId(stringId);
  }

  get value(): string {
    return this.props.value;
  }

  toNumber(): number {
    const num = Number(this.props.value);
    if (!Number.isInteger(num)) {
      throw new Error(`LaudoId ${this.props.value} não é um número inteiro válido.`);
    }
    return num;
  }

  equals(other: LaudoId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
