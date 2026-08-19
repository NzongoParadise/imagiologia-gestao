import { ValueObject } from "../../shared/base/ValueObject";
import { BusinessException } from "../../shared/exceptions/DomainException";

export type EstadoExameType =
  | "SOLICITADO"
  | "AGENDADO"
  | "EM_REALIZACAO"
  | "REALIZADO"
  | "LAUDADO"
  | "CANCELADO";

interface EstadoExameProps {
  estado: EstadoExameType;
}

export class EstadoExame extends ValueObject<EstadoExameProps> {
  private static readonly VALID_STATES: EstadoExameType[] = [
    "SOLICITADO",
    "AGENDADO",
    "EM_REALIZACAO",
    "REALIZADO",
    "LAUDADO",
    "CANCELADO",
  ];

  private static readonly TRANSITIONS: Record<EstadoExameType, EstadoExameType[]> = {
    SOLICITADO: ["AGENDADO", "EM_REALIZACAO", "CANCELADO"],
    AGENDADO: ["EM_REALIZACAO", "CANCELADO"],
    EM_REALIZACAO: ["REALIZADO", "CANCELADO"],
    REALIZADO: ["LAUDADO", "EM_REALIZACAO", "CANCELADO"],
    LAUDADO: [],
    CANCELADO: [],
  };

  private constructor(estado: EstadoExameType) {
    super({ estado });
  }

  static from(raw: string): EstadoExame {
    const normalizado = raw
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "_")
      .replace("EM_REALIZAÇÃO", "EM_REALIZACAO");

    if (normalizado === "SOLICITADO") return new EstadoExame("SOLICITADO");
    if (normalizado === "AGENDADO") return new EstadoExame("AGENDADO");
    if (normalizado === "EM_REALIZACAO" || normalizado === "EM_ANDAMENTO") return new EstadoExame("EM_REALIZACAO");
    if (normalizado === "REALIZADO" || normalizado === "CONCLUIDO") return new EstadoExame("REALIZADO");
    if (normalizado === "LAUDADO") return new EstadoExame("LAUDADO");
    if (normalizado === "CANCELADO") return new EstadoExame("CANCELADO");

    throw new BusinessException(
      `Estado de exame desconhecido: ${raw}`,
      "ESTADO_EXAME_INVALIDO"
    );
  }

  static inicial(): EstadoExame {
    return new EstadoExame("SOLICITADO");
  }

  get value(): EstadoExameType {
    return this.props.estado;
  }

  canTransitionTo(novoEstado: EstadoExameType): boolean {
    const permitidas = EstadoExame.TRANSITIONS[this.value];
    return permitidas.includes(novoEstado);
  }

  transitionTo(novoEstado: EstadoExameType): EstadoExame {
    if (!this.canTransitionTo(novoEstado)) {
      throw new BusinessException(
        `Transição de estado inválida para exame: de ${this.value} para ${novoEstado}`,
        "TRANSICAO_EXAME_INVALIDA"
      );
    }
    return new EstadoExame(novoEstado);
  }

  equals(other: EstadoExame): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }

  toDbLabel(): string {
    const labels: Record<EstadoExameType, string> = {
      SOLICITADO: "Solicitado",
      AGENDADO: "Agendado",
      EM_REALIZACAO: "Em Realizacao",
      REALIZADO: "Realizado",
      LAUDADO: "Laudado",
      CANCELADO: "Cancelado",
    };
    return labels[this.value];
  }
}
