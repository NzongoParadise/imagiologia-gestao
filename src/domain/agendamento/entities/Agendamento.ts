import { AggregateRoot } from "../../shared/base/AggregateRoot";
import { AgendamentoId } from "../value-objects/AgendamentoId";
import { EstadoAgendamento } from "../value-objects/EstadoAgendamento";
import { SlotHorario } from "../value-objects/SlotHorario";
import { ValidationException, BusinessException } from "../../shared/exceptions/DomainException";

export interface AgendamentoProps {
  pacienteId: number;
  atendimentoId?: number;
  especialidadeId?: number;
  consultorioId?: number;
  medicoId?: number;
  slot: SlotHorario;
  estado: EstadoAgendamento;
  observacoes?: string;
  criadoPorId?: number;
  criadoEm: Date;
}

export class Agendamento extends AggregateRoot<AgendamentoId> {
  private pacienteId: number;
  private atendimentoId?: number;
  private especialidadeId?: number;
  private consultorioId?: number;
  private medicoId?: number;
  private slot: SlotHorario;
  private estado: EstadoAgendamento;
  private observacoes?: string;
  private criadoPorId?: number;
  private criadoEm: Date;

  private constructor(id: AgendamentoId, props: AgendamentoProps) {
    super(id, props);
    this.pacienteId = props.pacienteId;
    this.atendimentoId = props.atendimentoId;
    this.especialidadeId = props.especialidadeId;
    this.consultorioId = props.consultorioId;
    this.medicoId = props.medicoId;
    this.slot = props.slot;
    this.estado = props.estado;
    this.observacoes = props.observacoes;
    this.criadoPorId = props.criadoPorId;
    this.criadoEm = props.criadoEm;
  }

  static agendar(props: {
    id?: string | number;
    pacienteId: number;
    atendimentoId?: number;
    especialidadeId?: number;
    consultorioId?: number;
    medicoId?: number;
    dataHora: Date | string;
    duracaoMin?: number;
    observacoes?: string;
    criadoPorId?: number;
  }): Agendamento {
    if (!props.pacienteId || props.pacienteId <= 0) {
      throw new ValidationException("ID do paciente é obrigatório.", "pacienteId");
    }

    const id = props.id ? AgendamentoId.from(props.id) : AgendamentoId.create();
    const slot = SlotHorario.create(props.dataHora, props.duracaoMin ?? 30);
    const estado = EstadoAgendamento.inicial();
    const agora = new Date();

    const agendamento = new Agendamento(id, {
      pacienteId: props.pacienteId,
      atendimentoId: props.atendimentoId,
      especialidadeId: props.especialidadeId,
      consultorioId: props.consultorioId,
      medicoId: props.medicoId,
      slot,
      estado,
      observacoes: props.observacoes?.trim(),
      criadoPorId: props.criadoPorId,
      criadoEm: agora,
    });

    agendamento.addDomainEvent({
      type: "AgendamentoCriado",
      aggregateId: id.value,
      timestamp: agora,
      dados: {
        pacienteId: props.pacienteId,
        dataHora: slot.inicio,
        duracaoMin: slot.duracaoMin,
        medicoId: props.medicoId,
        especialidadeId: props.especialidadeId,
        consultorioId: props.consultorioId,
      },
    });

    return agendamento;
  }

  static reconstituir(id: AgendamentoId, props: AgendamentoProps): Agendamento {
    return new Agendamento(id, props);
  }

  confirmar(): void {
    this.estado = this.estado.transitionTo("CONFIRMADO");

    this.addDomainEvent({
      type: "AgendamentoConfirmado",
      aggregateId: this.id.value,
      timestamp: new Date(),
    });
  }

  registarChegada(): void {
    this.estado = this.estado.transitionTo("CHEGOU");

    this.addDomainEvent({
      type: "PacienteChegou",
      aggregateId: this.id.value,
      timestamp: new Date(),
    });
  }

  concluir(atendimentoId?: number): void {
    if (atendimentoId) {
      this.atendimentoId = atendimentoId;
    }
    this.estado = this.estado.transitionTo("CONCLUIDO");

    this.addDomainEvent({
      type: "AgendamentoConcluido",
      aggregateId: this.id.value,
      timestamp: new Date(),
      atendimentoId: this.atendimentoId,
    });
  }

  cancelar(motivo?: string): void {
    this.estado = this.estado.transitionTo("CANCELADO");
    if (motivo) {
      this.observacoes = this.observacoes
        ? `${this.observacoes} | Cancelamento: ${motivo}`
        : `Cancelamento: ${motivo}`;
    }

    this.addDomainEvent({
      type: "AgendamentoCancelado",
      aggregateId: this.id.value,
      timestamp: new Date(),
      motivo,
    });
  }

  reagendar(novaDataHora: Date | string, novaDuracao?: number): void {
    if (this.estado.value === "CONCLUIDO" || this.estado.value === "CANCELADO") {
      throw new BusinessException(
        "Não é possível reagendar uma consulta concluída ou cancelada.",
        "AGENDAMENTO_FINALIZADO"
      );
    }

    const novoSlot = SlotHorario.create(novaDataHora, novaDuracao ?? this.slot.duracaoMin);
    this.slot = novoSlot;
    this.estado = EstadoAgendamento.inicial();

    this.addDomainEvent({
      type: "AgendamentoReagendado",
      aggregateId: this.id.value,
      timestamp: new Date(),
      novoInicio: novoSlot.inicio,
      novaDuracao: novoSlot.duracaoMin,
    });
  }

  atribuirConsultorio(consultorioId: number): void {
    this.consultorioId = consultorioId;
  }

  atribuirMedico(medicoId: number): void {
    this.medicoId = medicoId;
  }

  // Getters
  getId(): AgendamentoId {
    return this.id;
  }

  getPacienteId(): number {
    return this.pacienteId;
  }

  getAtendimentoId(): number | undefined {
    return this.atendimentoId;
  }

  getEspecialidadeId(): number | undefined {
    return this.especialidadeId;
  }

  getConsultorioId(): number | undefined {
    return this.consultorioId;
  }

  getMedicoId(): number | undefined {
    return this.medicoId;
  }

  getSlot(): SlotHorario {
    return this.slot;
  }

  getDataHora(): Date {
    return this.slot.inicio;
  }

  getDuracaoMin(): number {
    return this.slot.duracaoMin;
  }

  getEstado(): EstadoAgendamento {
    return this.estado;
  }

  getObservacoes(): string | undefined {
    return this.observacoes;
  }

  getCriadoPorId(): number | undefined {
    return this.criadoPorId;
  }

  getCriadoEm(): Date {
    return this.criadoEm;
  }
}
