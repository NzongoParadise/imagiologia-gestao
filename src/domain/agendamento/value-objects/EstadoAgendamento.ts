import { ValueObject } from "../../shared/base/ValueObject";
import { BusinessException } from "../../shared/exceptions/DomainException";

export type EstadoAgendamentoType =
  | "AGENDADO"
  | "CONFIRMADO"
  | "CHEGOU"
  | "CONCLUIDO"
  | "CANCELADO"
  | "NAO_COMPARECEU";

interface EstadoAgendamentoProps {
  estado: EstadoAgendamentoType;
}

export class EstadoAgendamento extends ValueObject<EstadoAgendamentoProps> {
  private static readonly VALID_STATES: EstadoAgendamentoType[] = [
    "AGENDADO",
    "CONFIRMADO",
    "CHEGOU",
    "CONCLUIDO",
    "CANCELADO",
    "NAO_COMPARECEU",
  ];

  private static readonly TRANSITIONS: Record<EstadoAgendamentoType, EstadoAgendamentoType[]> = {
    AGENDADO: ["CONFIRMADO", "CHEGOU", "CANCELADO", "NAO_COMPARECEU"],
    CONFIRMADO: ["CHEGOU", "CONCLUIDO", "CANCELADO", "NAO_COMPARECEU"],
    CHEGOU: ["CONCLUIDO", "CANCELADO"],
    CONCLUIDO: [],
    CANCELADO: [],
    NAO_COMPARECEU: [],
  };

  private constructor(estado: EstadoAgendamentoType) {
    super({ estado });
  }

  static from(raw: string): EstadoAgendamento {
    const normalizado = raw.trim().toUpperCase().replace(/\s+/g, "_");

    if (normalizado === "AGENDADO") return new EstadoAgendamento("AGENDADO");
    if (normalizado === "CONFIRMADO") return new EstadoAgendamento("CONFIRMADO");
    if (normalizado === "CHEGOU" || normalizado === "EM_ESPERA") return new EstadoAgendamento("CHEGOU");
    if (normalizado === "CONCLUIDO" || normalizado === "REALIZADO") return new EstadoAgendamento("CONCLUIDO");
    if (normalizado === "CANCELADO") return new EstadoAgendamento("CANCELADO");
    if (normalizado === "NAO_COMPARECEU" || normalizado === "FALTOU") return new EstadoAgendamento("NAO_COMPARECEU");

    throw new BusinessException(
      `Estado de agendamento desconhecido: ${raw}`,
      "ESTADO_AGENDAMENTO_INVALIDO"
    );
  }

  static inicial(): EstadoAgendamento {
    return new EstadoAgendamento("AGENDADO");
  }

  get value(): EstadoAgendamentoType {
    return this.props.estado;
  }

  canTransitionTo(novoEstado: EstadoAgendamentoType): boolean {
    const permitidas = EstadoAgendamento.TRANSITIONS[this.value];
    return permitidas.includes(novoEstado);
  }

  transitionTo(novoEstado: EstadoAgendamentoType): EstadoAgendamento {
    if (!this.canTransitionTo(novoEstado)) {
      throw new BusinessException(
        `Transição inválida de agendamento: de ${this.value} para ${novoEstado}`,
        "TRANSICAO_AGENDAMENTO_INVALIDA"
      );
    }
    return new EstadoAgendamento(novoEstado);
  }

  equals(other: EstadoAgendamento): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toDbLabel(): string {
    return this.value;
  }
}
