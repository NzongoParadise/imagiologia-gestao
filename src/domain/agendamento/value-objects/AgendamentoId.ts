import { ValueObject } from "../../shared/base/ValueObject";

interface AgendamentoIdProps {
  value: string;
}

export class AgendamentoId extends ValueObject<AgendamentoIdProps> {
  private constructor(id: string) {
    super({ value: id });
  }

  static create(): AgendamentoId {
    return new AgendamentoId(crypto.randomUUID());
  }

  static from(id: string | number): AgendamentoId {
    const stringId = String(id).trim();
    if (!stringId) {
      throw new Error("AgendamentoId não pode ser vazio.");
    }
    return new AgendamentoId(stringId);
  }

  get value(): string {
    return this.props.value;
  }

  toNumber(): number {
    const num = Number(this.props.value);
    if (!Number.isInteger(num)) {
      throw new Error(`AgendamentoId ${this.props.value} não é um número inteiro válido.`);
    }
    return num;
  }

  equals(other: AgendamentoId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
