import { ValidationException, BusinessException } from "../../../domain/shared/exceptions/DomainException";

/**
 * CriarAtendimentoValidator
 * Multi-layer validation for creating attendance
 */
export class CriarAtendimentoValidator {
  /**
   * Validate input data
   */
  static validarInput(input: {
    pacienteId?: unknown;
    especialidadeId?: unknown;
    tipo?: unknown;
    prioridade?: unknown;
  }): void {
    if (!input.pacienteId || typeof input.pacienteId !== "number") {
      throw new ValidationException(
        "pacienteId é obrigatório e deve ser um número",
        "pacienteId"
      );
    }

    if (!input.especialidadeId || typeof input.especialidadeId !== "number") {
      throw new ValidationException(
        "especialidadeId é obrigatório e deve ser um número",
        "especialidadeId"
      );
    }

    if (!input.tipo || !["CONSULTA", "URGENCIA"].includes(input.tipo as string)) {
      throw new ValidationException(
        "tipo é obrigatório e deve ser CONSULTA ou URGENCIA",
        "tipo"
      );
    }

    if (
      typeof input.prioridade !== "number" ||
      input.prioridade < 1 ||
      input.prioridade > 5
    ) {
      throw new ValidationException(
        "prioridade deve estar entre 1 e 5",
        "prioridade"
      );
    }
  }

  /**
   * Validate patient exists (simulated - would call repository)
   */
  static async validarPacienteExiste(pacienteId: number): Promise<void> {
    // TODO: Inject repository and check
    if (pacienteId <= 0) {
      throw new BusinessException(
        `Paciente ${pacienteId} não encontrado`,
        "PACIENTE_NAO_ENCONTRADO",
        { pacienteId }
      );
    }
  }

  /**
   * Validate specialty exists (simulated - would call repository)
   */
  static async validarEspecialidadeExiste(
    especialidadeId: number
  ): Promise<void> {
    // TODO: Inject repository and check
    if (especialidadeId <= 0) {
      throw new BusinessException(
        `Especialidade ${especialidadeId} não encontrada`,
        "ESPECIALIDADE_NAO_ENCONTRADA",
        { especialidadeId }
      );
    }
  }

  /**
   * Run all validations
   */
  static async validar(input: {
    pacienteId?: unknown;
    especialidadeId?: unknown;
    tipo?: unknown;
    prioridade?: unknown;
  }): Promise<void> {
    // Layer 1: Input validation
    this.validarInput(input);

    // Layer 2: Business validations (would use repositories)
    // await this.validarPacienteExiste(input.pacienteId as number);
    // await this.validarEspecialidadeExiste(input.especialidadeId as number);
  }
}
