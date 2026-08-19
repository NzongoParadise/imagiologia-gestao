import { ILaudoRepository } from "../../../domain/laudo";
import { AssinarLaudoRequest, LaudoResponse, mapLaudoToResponse } from "../dto/LaudoDTOs";
import { AssinarLaudoValidator } from "../validators/CriarLaudoValidator";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException, NotFoundException } from "../../../domain/shared/exceptions/DomainException";

export class AssinarLaudoUseCase {
  constructor(private readonly laudoRepository: ILaudoRepository) {}

  async execute(request: AssinarLaudoRequest): Promise<Result<LaudoResponse>> {
    try {
      await AssinarLaudoValidator.validar(request);

      const laudo = await this.laudoRepository.findById(request.id);
      if (!laudo) {
        throw new NotFoundException("Laudo não encontrado", "Laudo", request.id);
      }

      laudo.assinar(Number(request.medicoId), request.certificadoOuNome);

      const salvo = await this.laudoRepository.save(laudo);
      return Ok(mapLaudoToResponse(salvo));
    } catch (error) {
      if (error instanceof DomainException) {
        return Err(error);
      }
      return Err(new Error(`Erro ao assinar laudo: ${String(error)}`));
    }
  }
}
