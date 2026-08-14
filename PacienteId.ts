import { ValueObject } from "@/domain/shared/base/ValueObject";

export class AtendimentoId extends ValueObject<string> {
  private constructor(id: string) {
    super(id);
  }

  public static create(id: string): AtendimentoId {
    if (!id) {
      throw new Error("ID do Atendimento não pode ser nulo ou vazio.");
    }
    return new AtendimentoId(id);
  }

  public getValue(): string {
    return this.props;
  }
}