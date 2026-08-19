import { IPacienteRepository } from "../../../domain/paciente";
import { PacienteResponse, mapPacienteToResponse } from "../dto/PacienteDTOs";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException, NotFoundException } from "../../../domain/shared/exceptions/DomainException";

export class ObterPacientePorIdUseCase {
  constructor(private readonly pacienteRepository: IPacienteRepository) {}

  async execute(id: string | number): Promise<Result<PacienteResponse>> {
    try {
      const paciente = await this.pacienteRepository.findById(id);
      if (!paciente) {
        throw new NotFoundException("Paciente não encontrado", "Paciente", id);
      }
      return Ok(mapPacienteToResponse(paciente));
    } catch (error) {
      if (error instanceof DomainException) {
        return Err(error);
      }
      return Err(new Error(`Erro ao obter paciente: ${String(error)}`));
    }
  }
}
