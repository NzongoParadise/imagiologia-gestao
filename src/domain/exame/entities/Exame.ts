import { AggregateRoot } from "../../shared/base/AggregateRoot";
import { ExameId } from "../value-objects/ExameId";
import { CodigoExame } from "../value-objects/CodigoExame";
import { EstadoExame } from "../value-objects/EstadoExame";
import { PrioridadeExame } from "../value-objects/PrioridadeExame";
import { ValidationException, BusinessException } from "../../shared/exceptions/DomainException";

export interface ExameProps {
  codigo: CodigoExame;
  pacienteId: number;
  tipoExameId: number;
  tecnicoId?: number;
  procedenciaId?: number;
  medicoSolicitante?: string;
  observacao?: string;
  diagnosticoClinico?: string;
  justificacaoClinica?: string;
  estado: EstadoExame;
  prioridade: PrioridadeExame;
  dataExame: Date;
  criadoEm: Date;
  atualizadoEm: Date;
}

export class Exame extends AggregateRoot<ExameId> {
  private codigo: CodigoExame;
  private pacienteId: number;
  private tipoExameId: number;
  private tecnicoId?: number;
  private procedenciaId?: number;
  private medicoSolicitante?: string;
  private observacao?: string;
  private diagnosticoClinico?: string;
  private justificacaoClinica?: string;
  private estado: EstadoExame;
  private prioridade: PrioridadeExame;
  private dataExame: Date;
  private criadoEm: Date;
  private atualizadoEm: Date;

  private constructor(id: ExameId, props: ExameProps) {
    super(id, props);
    this.codigo = props.codigo;
    this.pacienteId = props.pacienteId;
    this.tipoExameId = props.tipoExameId;
    this.tecnicoId = props.tecnicoId;
    this.procedenciaId = props.procedenciaId;
    this.medicoSolicitante = props.medicoSolicitante;
    this.observacao = props.observacao;
    this.diagnosticoClinico = props.diagnosticoClinico;
    this.justificacaoClinica = props.justificacaoClinica;
    this.estado = props.estado;
    this.prioridade = props.prioridade;
    this.dataExame = props.dataExame;
    this.criadoEm = props.criadoEm;
    this.atualizadoEm = props.atualizadoEm;
  }

  static solicitar(props: {
    id?: string | number;
    codigo?: string;
    modalidade?: string;
    pacienteId: number;
    tipoExameId: number;
    tecnicoId?: number;
    procedenciaId?: number;
    medicoSolicitante?: string;
    observacao?: string;
    diagnosticoClinico?: string;
    justificacaoClinica?: string;
    prioridade?: string | number;
    dataExame?: Date;
  }): Exame {
    if (!props.pacienteId || props.pacienteId <= 0) {
      throw new ValidationException("ID do paciente é obrigatório e deve ser válido.", "pacienteId");
    }

    if (!props.tipoExameId || props.tipoExameId <= 0) {
      throw new ValidationException("ID do tipo de exame é obrigatório.", "tipoExameId");
    }

    const id = props.id ? ExameId.from(props.id) : ExameId.create();
    const codigo = props.codigo
      ? CodigoExame.create(props.codigo)
      : CodigoExame.gerarAutomatico(props.modalidade);

    const prioridade = PrioridadeExame.from(props.prioridade ?? "NORMAL");
    const estado = EstadoExame.inicial();
    const agora = new Date();

    const exame = new Exame(id, {
      codigo,
      pacienteId: props.pacienteId,
      tipoExameId: props.tipoExameId,
      tecnicoId: props.tecnicoId,
      procedenciaId: props.procedenciaId,
      medicoSolicitante: props.medicoSolicitante?.trim(),
      observacao: props.observacao?.trim(),
      diagnosticoClinico: props.diagnosticoClinico?.trim(),
      justificacaoClinica: props.justificacaoClinica?.trim(),
      estado,
      prioridade,
      dataExame: props.dataExame ?? agora,
      criadoEm: agora,
      atualizadoEm: agora,
    });

    exame.addDomainEvent({
      type: "ExameSolicitado",
      aggregateId: id.value,
      timestamp: agora,
      dados: {
        codigo: codigo.value,
        pacienteId: props.pacienteId,
        tipoExameId: props.tipoExameId,
        prioridade: prioridade.valor,
      },
    });

    return exame;
  }

  static reconstituir(id: ExameId, props: ExameProps): Exame {
    return new Exame(id, props);
  }

  atribuirTecnico(tecnicoId: number): void {
    if (!tecnicoId || tecnicoId <= 0) {
      throw new ValidationException("ID de técnico inválido.", "tecnicoId");
    }
    this.tecnicoId = tecnicoId;
    this.atualizadoEm = new Date();
  }

  iniciarRealizacao(tecnicoId?: number): void {
    if (tecnicoId) {
      this.atribuirTecnico(tecnicoId);
    }
    this.estado = this.estado.transitionTo("EM_REALIZACAO");
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "ExameIniciado",
      aggregateId: this.id.value,
      timestamp: this.atualizadoEm,
      tecnicoId: this.tecnicoId,
    });
  }

  concluirRealizacao(): void {
    this.estado = this.estado.transitionTo("REALIZADO");
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "ExameRealizado",
      aggregateId: this.id.value,
      timestamp: this.atualizadoEm,
      tecnicoId: this.tecnicoId,
    });
  }

  marcarComoLaudado(laudoId: number | string): void {
    this.estado = this.estado.transitionTo("LAUDADO");
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "ExameLaudado",
      aggregateId: this.id.value,
      timestamp: this.atualizadoEm,
      laudoId,
    });
  }

  cancelar(motivo?: string): void {
    this.estado = this.estado.transitionTo("CANCELADO");
    if (motivo) {
      this.observacao = this.observacao
        ? `${this.observacao} | Cancelamento: ${motivo}`
        : `Cancelamento: ${motivo}`;
    }
    this.atualizadoEm = new Date();

    this.addDomainEvent({
      type: "ExameCancelado",
      aggregateId: this.id.value,
      timestamp: this.atualizadoEm,
      motivo,
    });
  }

  atualizarDadosClinicos(props: {
    diagnosticoClinico?: string;
    justificacaoClinica?: string;
    observacao?: string;
  }): void {
    if (this.estado.value === "LAUDADO" || this.estado.value === "CANCELADO") {
      throw new BusinessException(
        "Não é possível editar dados clínicos de um exame concluído ou cancelado.",
        "EXAME_FINALIZADO"
      );
    }

    if (props.diagnosticoClinico !== undefined) this.diagnosticoClinico = props.diagnosticoClinico?.trim();
    if (props.justificacaoClinica !== undefined) this.justificacaoClinica = props.justificacaoClinica?.trim();
    if (props.observacao !== undefined) this.observacao = props.observacao?.trim();
    this.atualizadoEm = new Date();
  }

  // Getters
  getId(): ExameId {
    return this.id;
  }

  getCodigo(): CodigoExame {
    return this.codigo;
  }

  getPacienteId(): number {
    return this.pacienteId;
  }

  getTipoExameId(): number {
    return this.tipoExameId;
  }

  getTecnicoId(): number | undefined {
    return this.tecnicoId;
  }

  getProcedenciaId(): number | undefined {
    return this.procedenciaId;
  }

  getMedicoSolicitante(): string | undefined {
    return this.medicoSolicitante;
  }

  getObservacao(): string | undefined {
    return this.observacao;
  }

  getDiagnosticoClinico(): string | undefined {
    return this.diagnosticoClinico;
  }

  getJustificacaoClinica(): string | undefined {
    return this.justificacaoClinica;
  }

  getEstado(): EstadoExame {
    return this.estado;
  }

  getPrioridade(): PrioridadeExame {
    return this.prioridade;
  }

  getDataExame(): Date {
    return this.dataExame;
  }

  getCriadoEm(): Date {
    return this.criadoEm;
  }

  getAtualizadoEm(): Date {
    return this.atualizadoEm;
  }
}
