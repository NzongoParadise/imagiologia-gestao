import { ValueObject } from "../../shared/base/ValueObject";
import { ValidationException } from "../../shared/exceptions/DomainException";

interface SlotHorarioProps {
  inicio: Date;
  duracaoMin: number;
  fim: Date;
}

export class SlotHorario extends ValueObject<SlotHorarioProps> {
  private constructor(props: SlotHorarioProps) {
    super(props);
  }

  static create(inicio: Date | string, duracaoMin: number = 30): SlotHorario {
    const dataInicio = new Date(inicio);
    if (isNaN(dataInicio.getTime())) {
      throw new ValidationException("Data e hora de agendamento inválidas.", "dataHora");
    }

    if (!duracaoMin || duracaoMin < 5 || duracaoMin > 480) {
      throw new ValidationException(
        "Duração do agendamento deve estar entre 5 e 480 minutos.",
        "duracaoMin"
      );
    }

    const dataFim = new Date(dataInicio.getTime() + duracaoMin * 60000);

    return new SlotHorario({
      inicio: dataInicio,
      duracaoMin,
      fim: dataFim,
    });
  }

  get inicio(): Date {
    return this.props.inicio;
  }

  get duracaoMin(): number {
    return this.props.duracaoMin;
  }

  get fim(): Date {
    return this.props.fim;
  }

  sobrepoe(outro: SlotHorario): boolean {
    return this.inicio < outro.fim && this.fim > outro.inicio;
  }

  equals(other: SlotHorario): boolean {
    return (
      this.inicio.getTime() === other.inicio.getTime() &&
      this.duracaoMin === other.duracaoMin
    );
  }

  toString(): string {
    return `${this.inicio.toISOString()} (${this.duracaoMin} min até ${this.fim.toISOString()})`;
  }
}
