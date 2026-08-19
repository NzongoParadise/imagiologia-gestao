import { IExameRepository } from "../../../domain/exame";
import { ExameResponse, mapExameToResponse } from "../dto/ExameDTOs";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException, NotFoundException } from "../../../domain/shared/exceptions/DomainException";

export class ObterExamePorIdUseCase {
  constructor(private readonly exameRepository: IExameRepository) {}

  async execute(id: string | number): Promise<Result<ExameResponse>> {
    try {
      const exame = await this.exameRepository.findById(id);
      if (!exame) {
        throw new NotFoundException("Exame não encontrado", "Exame", id);
      }
      return Ok(mapExameToResponse(exame));
    } catch (error) {
      if (error instanceof DomainException) {
        return Err(error);
      }
      return Err(new Error(`Erro ao obter exame: ${String(error)}`));
    }
  }
}
