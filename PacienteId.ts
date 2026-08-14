import { ValueObject } from "@/domain/shared/base/ValueObject";

export class PacienteId extends ValueObject<number> {
  private constructor(id: number) {
    super(id);
  }

  public static create(id: number): PacienteId {
    if (id === null || id === undefined || id <= 0) {
      throw new Error("ID do Paciente inválido.");
    }
    return new PacienteId(id);
  }

  public getValue(): number {
    return this.props;
  }
}