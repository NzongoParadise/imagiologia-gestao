import { IAgendamentoRepository } from "../../../domain/agendamento";
import { AgendamentoResponse, mapAgendamentoToResponse } from "../dto/AgendamentoDTOs";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException, NotFoundException } from "../../../domain/shared/exceptions/DomainException";

export class CancelarAgendamentoUseCase {
  constructor(private readonly agendamentoRepository: IAgendamentoRepository) {}

  async execute(id: string | number, motivo?: string): Promise<Result<AgendamentoResponse>> {
    try {
      const agendamento = await this.agendamentoRepository.findById(id);
      if (!agendamento) {
        throw new NotFoundException("Agendamento não encontrado", "Agendamento", id);
      }

      agendamento.cancelar(motivo);

      const salvo = await this.agendamentoRepository.save(agendamento);
      return Ok(mapAgendamentoToResponse(salvo));
    } catch (error) {
      if (error instanceof DomainException) {
        return Err(error);
      }
      return Err(new Error(`Erro ao cancelar agendamento: ${String(error)}`));
    }
  }
}
