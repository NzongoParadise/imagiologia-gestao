import { ValueObject } from "../../shared/base/ValueObject";

export type PrioridadeExameType = "NORMAL" | "URGENTE" | "EMERGENCIA";

interface PrioridadeExameProps {
  valor: PrioridadeExameType;
  nivel: number;
}

export class PrioridadeExame extends ValueObject<PrioridadeExameProps> {
  private constructor(valor: PrioridadeExameType, nivel: number) {
    super({ valor, nivel });
  }

  static from(raw: string | number = "NORMAL"): PrioridadeExame {
    if (typeof raw === "number") {
      if (raw >= 3) return new PrioridadeExame("EMERGENCIA", 3);
      if (raw === 2) return new PrioridadeExame("URGENTE", 2);
      return new PrioridadeExame("NORMAL", 1);
    }

    const str = raw.trim().toUpperCase();
    if (str === "EMERGENCIA" || str === "MUITO_URGENTE") {
      return new PrioridadeExame("EMERGENCIA", 3);
    }
    if (str === "URGENTE" || str === "PRIORIDADE") {
      return new PrioridadeExame("URGENTE", 2);
    }
    return new PrioridadeExame("NORMAL", 1);
  }

  static normal(): PrioridadeExame {
    return new PrioridadeExame("NORMAL", 1);
  }

  get valor(): PrioridadeExameType {
    return this.props.valor;
  }

  get nivel(): number {
    return this.props.nivel;
  }

  equals(other: PrioridadeExame): boolean {
    return this.valor === other.valor;
  }

  toString(): string {
    return this.valor;
  }

  toDbLabel(): string {
    const labels: Record<PrioridadeExameType, string> = {
      NORMAL: "Normal",
      URGENTE: "Urgente",
      EMERGENCIA: "Emergência",
    };
    return labels[this.valor];
  }
}
