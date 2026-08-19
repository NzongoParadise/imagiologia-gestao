import { Paciente, IPacienteRepository } from "../../../domain/paciente";
import { RegistarPacienteRequest, PacienteResponse, mapPacienteToResponse } from "../dto/PacienteDTOs";
import { RegistarPacienteValidator } from "../validators/RegistarPacienteValidator";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException, BusinessException } from "../../../domain/shared/exceptions/DomainException";

export class RegistarPacienteUseCase {
  constructor(private readonly pacienteRepository?: IPacienteRepository) {}

  async execute(request: RegistarPacienteRequest): Promise<Result<PacienteResponse>> {
    try {
      await RegistarPacienteValidator.validar(request);

      if (this.pacienteRepository && request.numeroProcesso) {
        const existente = await this.pacienteRepository.findByNumeroProcesso(request.numeroProcesso);
        if (existente) {
          throw new BusinessException(
            `Já existe um paciente registado com o processo ${request.numeroProcesso}.`,
            "NUMERO_PROCESSO_DUPLICADO",
            { numeroProcesso: request.numeroProcesso }
          );
        }
      }

      const paciente = Paciente.criar({
        numeroProcesso: request.numeroProcesso,
        nome: request.nome,
        dataNascimento: request.dataNascimento ? new Date(request.dataNascimento) : undefined,
        sexo: request.sexo,
        telefone: request.telefone,
        email: request.email,
        nif: request.nif,
        bi: request.bi,
        documento: request.documento,
        endereco: request.endereco,
        foto: request.foto,
        observacoes: request.observacoes,
      });

      let salvo = paciente;
      if (this.pacienteRepository) {
        salvo = await this.pacienteRepository.save(paciente);
      }

      return Ok(mapPacienteToResponse(salvo));
    } catch (error) {
      if (error instanceof DomainException) {
        return Err(error);
      }
      return Err(new Error(`Erro inesperado ao registar paciente: ${String(error)}`));
    }
  }
}
