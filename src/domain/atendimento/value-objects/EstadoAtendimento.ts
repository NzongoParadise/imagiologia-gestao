import { ValueObject } from "../../shared/base/ValueObject";

/**
 * EstadoAtendimento - Value Object for attendance state
 * Enforces state machine transitions
 */
export type EstadoType =
  | "AGUARDANDO"
  | "TRIAGEM"
  | "EM_ATENDIMENTO"
  | "CONCLUIDO"
  | "CANCELADO";

interface EstadoProps {
  estado: EstadoType;
}

export class EstadoAtendimento extends ValueObject<EstadoProps> {
  private static readonly VALID_STATES: EstadoType[] = [
    "AGUARDANDO",
    "TRIAGEM",
    "EM_ATENDIMENTO",
    "CONCLUIDO",
    "CANCELADO",
  ];

  private static readonly STATE_TRANSITIONS: Record<EstadoType, EstadoType[]> =
    {
      AGUARDANDO: ["TRIAGEM", "CANCELADO"],
      TRIAGEM: ["EM_ATENDIMENTO", "CANCELADO"],
      EM_ATENDIMENTO: ["CONCLUIDO", "CANCELADO"],
      CONCLUIDO: [],
      CANCELADO: [],
    };

  private constructor(estado: EstadoType) {
    super({ estado });
  }

  static create(estado: EstadoType): EstadoAtendimento {
    if (!this.VALID_STATES.includes(estado)) {
      throw new Error(`Estado inválido: ${estado}`);
    }
    return new EstadoAtendimento(estado);
  }

  static inicial(): EstadoAtendimento {
    return new EstadoAtendimento("AGUARDANDO");
  }

  get value(): EstadoType {
    return this.props.estado;
  }

  canTransitionTo(novoEstado: EstadoType): boolean {
    const transicoes = EstadoAtendimento.STATE_TRANSITIONS[this.value];
    return transicoes.includes(novoEstado);
  }

  transitionTo(novoEstado: EstadoType): EstadoAtendimento {
    if (!this.canTransitionTo(novoEstado)) {
      throw new Error(
        `Transição inválida de ${this.value} para ${novoEstado}`
      );
    }
    return new EstadoAtendimento(novoEstado);
  }

  equals(other: EstadoAtendimento): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toLabel(): string {
    const labels: Record<EstadoType, string> = {
      AGUARDANDO: "Aguardando",
      TRIAGEM: "Triagem",
      EM_ATENDIMENTO: "Em Atendimento",
      CONCLUIDO: "Concluído",
      CANCELADO: "Cancelado",
    };
    return labels[this.value];
  }
}
