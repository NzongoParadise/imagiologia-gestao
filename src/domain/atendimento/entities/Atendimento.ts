import { AggregateRoot } from "../../shared/base/AggregateRoot";
import { AtendimentoId } from "../value-objects/AtendimentoId";
import { EstadoAtendimento } from "../value-objects/EstadoAtendimento";
import { Senha } from "../value-objects/Senha";
import { BusinessException } from "../../shared/exceptions/DomainException";

/**
 * Atendimento - Aggregate Root for attendance management
 * Represents a single attendance (consultation or emergency)
 */
interface AtendimentoProps {
  codigo: string;
  senha: Senha;
  tipo: "CONSULTA" | "URGENCIA";
  pacienteId: number;
  especialidadeId: number;
  consultorioId?: number;
  estado: EstadoAtendimento;
  prioridade: number;
  criadoEm: Date;
  atualizadoEm: Date;
  canceladoEm?: Date;
  motivo_cancelamento?: string;
}

export class Atendimento extends AggregateRoot<AtendimentoId> {
  private codigo: string;
  private senha: Senha;
  private tipo: "CONSULTA" | "URGENCIA";
  private pacienteId: number;
  private especialidadeId: number;
  private consultorioId?: number;
  private estado: EstadoAtendimento;
  private prioridade: number;
  private criadoEm: Date;
  private atualizadoEm: Date;
  private canceladoEm?: Date;
  private motivo_cancelamento?: string;

  private constructor(
    id: AtendimentoId,
    props: AtendimentoProps
  ) {
    super(id, props);
    this.codigo = props.codigo;
    this.senha = props.senha;
    this.tipo = props.tipo;
    this.pacienteId = props.pacienteId;
    this.especialidadeId = props.especialidadeId;
    this.consultorioId = props.consultorioId;
    this.estado = props.estado;
    this.prioridade = props.prioridade;
    this.criadoEm = props.criadoEm;
    this.atualizadoEm = props.atualizadoEm;
    this.canceladoEm = props.canceladoEm;
    this.motivo_cancelamento = props.motivo_cancelamento;
  }

  /**
   * Factory method to create new Atendimento
   */
  static create(props: {
    codigo: string;
    senha: Senha;
    tipo: "CONSULTA" | "URGENCIA";
    pacienteId: number;
    especialidadeId: number;
    prioridade: number;
  }): Atendimento {
    const id = AtendimentoId.create();
    const now = new Date();

    const atendimento = new Atendimento(id, {
      ...props,
      estado: EstadoAtendimento.inicial(),
      criadoEm: now,
      atualizadoEm: now,
    });

    // Publish event
    atendimento.addDomainEvent({
      type: "AtendimentoCriado",
      aggregateId: id.value,
      props,
      timestamp: now,
    });

    return atendimento;
  }

  /**
   * Reconstruct from persistence
   */
  static reconstitute(
    id: AtendimentoId,
    props: AtendimentoProps
  ): Atendimento {
    return new Atendimento(id, props);
  }

  // Getters
  getId(): AtendimentoId {
    return this.id;
  }

  getCodigo(): string {
    return this.codigo;
  }

  getSenha(): Senha {
    return this.senha;
  }

  getTipo(): "CONSULTA" | "URGENCIA" {
    return this.tipo;
  }

  getPacienteId(): number {
    return this.pacienteId;
  }

  getEspecialidadeId(): number {
    return this.especialidadeId;
  }

  getConsultorioId(): number | undefined {
    return this.consultorioId;
  }

  getEstado(): EstadoAtendimento {
    return this.estado;
  }

  getPrioridade(): number {
    return this.prioridade;
  }

  getCriadoEm(): Date {
    return this.criadoEm;
  }

  getAtualizadoEm(): Date {
    return this.atualizadoEm;
  }

  getCanceladoEm(): Date | undefined {
    return this.canceladoEm;
  }

  getMotivoCancelamento(): string | undefined {
    return this.motivo_cancelamento;
  }

  // Business Methods
  /**
   * Start triage for this attendance
   */
  iniciarTriagem(): void {
    if (!this.estado.canTransitionTo("TRIAGEM")) {
      throw new BusinessException(
        `Cannot start triage from state ${this.estado.toString()}`,
        "ESTADO_INVALIDO"
      );
    }

    this.estado = this.estado.transitionTo("TRIAGEM");
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "TriagemIniciada",
      aggregateId: this.id.value,
      estado: this.estado.toString(),
      timestamp: this.atualizadoEm,
    });
  }

  /**
   * Start attendance
   */
  iniciarAtendimento(consultorioId: number): void {
    if (!this.estado.canTransitionTo("EM_ATENDIMENTO")) {
      throw new BusinessException(
        `Cannot start attendance from state ${this.estado.toString()}`,
        "ESTADO_INVALIDO"
      );
    }

    this.consultorioId = consultorioId;
    this.estado = this.estado.transitionTo("EM_ATENDIMENTO");
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "AtendimentoIniciado",
      aggregateId: this.id.value,
      consultorioId,
      timestamp: this.atualizadoEm,
    });
  }

  /**
   * Complete attendance
   */
  concluir(): void {
    if (this.estado.equals(EstadoAtendimento.create("CONCLUIDO"))) {
      throw new BusinessException(
        "Attendance already completed",
        "ATENDIMENTO_JA_CONCLUIDO"
      );
    }

    if (!this.estado.canTransitionTo("CONCLUIDO")) {
      throw new BusinessException(
        `Cannot complete attendance from state ${this.estado.toString()}`,
        "ESTADO_INVALIDO"
      );
    }

    this.estado = this.estado.transitionTo("CONCLUIDO");
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "AtendimentoConcluido",
      aggregateId: this.id.value,
      timestamp: this.atualizadoEm,
    });
  }

  /**
   * Cancel attendance with reason
   */
  cancelar(motivo: string): void {
    if (this.estado.equals(EstadoAtendimento.create("CONCLUIDO"))) {
      throw new BusinessException(
        "Cannot cancel completed attendance",
        "ATENDIMENTO_JA_CONCLUIDO"
      );
    }

    if (!this.estado.canTransitionTo("CANCELADO")) {
      throw new BusinessException(
        `Cannot cancel attendance from state ${this.estado.toString()}`,
        "CANCELAMENTO_INVALIDO"
      );
    }

    if (!motivo || motivo.trim().length === 0) {
      throw new BusinessException(
        "Cancellation reason is required",
        "MOTIVO_OBRIGATORIO"
      );
    }

    this.estado = this.estado.transitionTo("CANCELADO");
    this.canceladoEm = new Date();
    this.motivo_cancelamento = motivo;
    this.atualizadoEm = this.canceladoEm;

    this.addDomainEvent({
      type: "AtendimentoCancelado",
      aggregateId: this.id.value,
      motivo,
      timestamp: this.canceladoEm,
    });
  }

  /**
   * Get all props as plain object (for persistence)
   */
  getProps(): AtendimentoProps {
    return {
      codigo: this.codigo,
      senha: this.senha,
      tipo: this.tipo,
      pacienteId: this.pacienteId,
      especialidadeId: this.especialidadeId,
      consultorioId: this.consultorioId,
      estado: this.estado,
      prioridade: this.prioridade,
      criadoEm: this.criadoEm,
      atualizadoEm: this.atualizadoEm,
      canceladoEm: this.canceladoEm,
      motivo_cancelamento: this.motivo_cancelamento,
    };
  }
}
