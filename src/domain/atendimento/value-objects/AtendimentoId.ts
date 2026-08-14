import { ValueObject } from "../../shared/base/ValueObject";

/**
 * AtendimentoId - Value Object for attendance ID (UUID)
 */
interface AtendimentoIdProps {
  value: string;
}

export class AtendimentoId extends ValueObject<AtendimentoIdProps> {
  private constructor(id: string) {
    super({ value: id });
  }

  /**
   * Create a new random AtendimentoId
   */
  static create(): AtendimentoId {
    return new AtendimentoId(crypto.randomUUID());
  }

  /**
   * Create from existing ID (e.g., from database)
   */
  static from(id: string): AtendimentoId {
    if (!id || id.length === 0) {
      throw new Error("AtendimentoId cannot be empty");
    }
    if (/^\d+$/.test(id)) return new AtendimentoId(id);
    // Basic UUID validation
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new Error(`Invalid UUID format: ${id}`);
    }
    return new AtendimentoId(id);
  }

  get value(): string {
    return this.props.value;
  }

  equals(other: AtendimentoId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
