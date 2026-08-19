import { IPacienteRepository } from "../../../domain/paciente";
import { AtualizarPacienteRequest, PacienteResponse, mapPacienteToResponse } from "../dto/PacienteDTOs";
import { RegistarPacienteValidator } from "../validators/RegistarPacienteValidator";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException, NotFoundException } from "../../../domain/shared/exceptions/DomainException";

export class AtualizarPacienteUseCase {
  constructor(private readonly pacienteRepository: IPacienteRepository) {}

  async execute(request: AtualizarPacienteRequest): Promise<Result<PacienteResponse>> {
    try {
      await RegistarPacienteValidator.validarAtualizacao(request);

      const paciente = await this.pacienteRepository.findById(request.id);
      if (!paciente) {
        throw new NotFoundException("Paciente não encontrado", "Paciente", request.id);
      }

      paciente.atualizarDados({
        nome: request.nome,
        dataNascimento: request.dataNascimento ? new Date(request.dataNascimento) : undefined,
        sexo: request.sexo,
        endereco: request.endereco,
        foto: request.foto,
        observacoes: request.observacoes,
      });

      if (request.telefone !== undefined || request.email !== undefined) {
        paciente.atualizarContacto(
          request.telefone ?? paciente.getContacto().telefone,
          request.email ?? paciente.getContacto().email
        );
      }

      if (request.nif !== undefined || request.bi !== undefined || request.documento !== undefined) {
        paciente.atualizarDocumentos(
          request.nif ?? paciente.getDocumento().nif,
          request.bi ?? paciente.getDocumento().bi,
          request.documento ?? paciente.getDocumento().documentoOutro
        );
      }

      const atualizado = await this.pacienteRepository.save(paciente);
      return Ok(mapPacienteToResponse(atualizado));
    } catch (error) {
      if (error instanceof DomainException) {
        return Err(error);
      }
      return Err(new Error(`Erro inesperado ao atualizar paciente: ${String(error)}`));
    }
  }
}
