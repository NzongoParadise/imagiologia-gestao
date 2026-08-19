import { Laudo, ILaudoRepository } from "../../../domain/laudo";
import { CriarLaudoRequest, LaudoResponse, mapLaudoToResponse } from "../dto/LaudoDTOs";
import { CriarLaudoValidator } from "../validators/CriarLaudoValidator";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException, BusinessException } from "../../../domain/shared/exceptions/DomainException";

export class CriarLaudoUseCase {
  constructor(private readonly laudoRepository?: ILaudoRepository) {}

  async execute(request: CriarLaudoRequest): Promise<Result<LaudoResponse>> {
    try {
      await CriarLaudoValidator.validar(request);

      if (this.laudoRepository) {
        const existente = await this.laudoRepository.findByExameId(request.exameId);
        if (existente) {
          throw new BusinessException(
            `Já existe um laudo registado para o exame ID ${request.exameId}.`,
            "LAUDO_DUPLICADO",
            { exameId: request.exameId }
          );
        }
      }

      const laudo = Laudo.criarRascunho({
        exameId: Number(request.exameId),
        conteudo: request.conteudo,
      });

      let salvo = laudo;
      if (this.laudoRepository) {
        salvo = await this.laudoRepository.save(laudo);
      }

      return Ok(mapLaudoToResponse(salvo));
    } catch (error) {
      if (error instanceof DomainException) {
        return Err(error);
      }
      return Err(new Error(`Erro inesperado ao criar laudo: ${String(error)}`));
    }
  }
}
