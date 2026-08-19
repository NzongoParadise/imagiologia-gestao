import { ValueObject } from "../../shared/base/ValueObject";

interface ExameIdProps {
  value: string;
}

export class ExameId extends ValueObject<ExameIdProps> {
  private constructor(id: string) {
    super({ value: id });
  }

  static create(): ExameId {
    return new ExameId(crypto.randomUUID());
  }

  static from(id: string | number): ExameId {
    const stringId = String(id).trim();
    if (!stringId) {
      throw new Error("ExameId não pode ser vazio.");
    }
    return new ExameId(stringId);
  }

  get value(): string {
    return this.props.value;
  }

  toNumber(): number {
    const num = Number(this.props.value);
    if (!Number.isInteger(num)) {
      throw new Error(`ExameId ${this.props.value} não é um número válido.`);
    }
    return num;
  }

  equals(other: ExameId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
