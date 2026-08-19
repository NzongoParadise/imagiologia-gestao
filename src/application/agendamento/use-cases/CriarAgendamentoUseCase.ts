import { Agendamento, IAgendamentoRepository, SlotHorario } from "../../../domain/agendamento";
import { CriarAgendamentoRequest, AgendamentoResponse, mapAgendamentoToResponse } from "../dto/AgendamentoDTOs";
import { CriarAgendamentoValidator } from "../validators/CriarAgendamentoValidator";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException, BusinessException } from "../../../domain/shared/exceptions/DomainException";

export class CriarAgendamentoUseCase {
  constructor(private readonly agendamentoRepository?: IAgendamentoRepository) {}

  async execute(request: CriarAgendamentoRequest): Promise<Result<AgendamentoResponse>> {
    try {
      await CriarAgendamentoValidator.validar(request);

      const novoSlot = SlotHorario.create(request.dataHora, request.duracaoMin ?? 30);

      if (this.agendamentoRepository && request.medicoId) {
        const agendamentosMedico = await this.agendamentoRepository.findByMedicoId(
          request.medicoId,
          novoSlot.inicio
        );

        const conflito = agendamentosMedico.some(
          (a) =>
            a.getEstado().value !== "CANCELADO" &&
            a.getSlot().sobrepoe(novoSlot)
        );

        if (conflito) {
          throw new BusinessException(
            "Existe um conflito de horário com outro agendamento para este médico.",
            "CONFLITO_HORARIO_MEDICO",
            { medicoId: request.medicoId, dataHora: request.dataHora }
          );
        }
      }

      const agendamento = Agendamento.agendar({
        pacienteId: Number(request.pacienteId),
        atendimentoId: request.atendimentoId ? Number(request.atendimentoId) : undefined,
        especialidadeId: request.especialidadeId ? Number(request.especialidadeId) : undefined,
        consultorioId: request.consultorioId ? Number(request.consultorioId) : undefined,
        medicoId: request.medicoId ? Number(request.medicoId) : undefined,
        dataHora: novoSlot.inicio,
        duracaoMin: novoSlot.duracaoMin,
        observacoes: request.observacoes,
        criadoPorId: request.criadoPorId ? Number(request.criadoPorId) : undefined,
      });

      let salvo = agendamento;
      if (this.agendamentoRepository) {
        salvo = await this.agendamentoRepository.save(agendamento);
      }

      return Ok(mapAgendamentoToResponse(salvo));
    } catch (error) {
      if (error instanceof DomainException) {
        return Err(error);
      }
      return Err(new Error(`Erro inesperado ao criar agendamento: ${String(error)}`));
    }
  }
}
