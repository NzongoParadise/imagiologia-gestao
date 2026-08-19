import { IExameRepository } from "../../../domain/exame";
import { AtualizarEstadoExameRequest, ExameResponse, mapExameToResponse } from "../dto/ExameDTOs";
import { SolicitarExameValidator } from "../validators/SolicitarExameValidator";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException, NotFoundException } from "../../../domain/shared/exceptions/DomainException";

export class AtualizarEstadoExameUseCase {
  constructor(private readonly exameRepository: IExameRepository) {}

  async execute(request: AtualizarEstadoExameRequest): Promise<Result<ExameResponse>> {
    try {
      await SolicitarExameValidator.validarAtualizacaoEstado(request);

      const exame = await this.exameRepository.findById(request.id);
      if (!exame) {
        throw new NotFoundException("Exame não encontrado", "Exame", request.id);
      }

      switch (request.acao) {
        case "INICIAR":
          exame.iniciarRealizacao(request.tecnicoId);
          break;
        case "CONCLUIR":
          exame.concluirRealizacao();
          break;
        case "LAUDAR":
          if (!request.laudoId) throw new Error("laudoId é obrigatório");
          exame.marcarComoLaudado(request.laudoId);
          break;
        case "CANCELAR":
          exame.cancelar(request.motivo);
          break;
      }

      const salvo = await this.exameRepository.save(exame);
      return Ok(mapExameToResponse(salvo));
    } catch (error) {
      if (error instanceof DomainException) {
        return Err(error);
      }
      return Err(new Error(`Erro ao atualizar estado do exame: ${String(error)}`));
    }
  }
}
