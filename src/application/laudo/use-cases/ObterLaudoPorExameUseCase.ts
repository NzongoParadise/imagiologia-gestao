import { ILaudoRepository } from "../../../domain/laudo";
import { LaudoResponse, mapLaudoToResponse } from "../dto/LaudoDTOs";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException, NotFoundException } from "../../../domain/shared/exceptions/DomainException";

export class ObterLaudoPorExameUseCase {
  constructor(private readonly laudoRepository: ILaudoRepository) {}

  async execute(exameId: number): Promise<Result<LaudoResponse>> {
    try {
      const laudo = await this.laudoRepository.findByExameId(exameId);
      if (!laudo) {
        throw new NotFoundException("Laudo não encontrado para o exame", "Laudo", exameId);
      }
      return Ok(mapLaudoToResponse(laudo));
    } catch (error) {
      if (error instanceof DomainException) {
        return Err(error);
      }
      return Err(new Error(`Erro ao obter laudo: ${String(error)}`));
    }
  }
}
