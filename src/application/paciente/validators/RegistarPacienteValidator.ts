import { RegistarPacienteRequest, AtualizarPacienteRequest } from "../dto/PacienteDTOs";
import { ValidationException } from "../../../domain/shared/exceptions/DomainException";

export class RegistarPacienteValidator {
  static async validar(request: RegistarPacienteRequest): Promise<void> {
    if (!request.nome || request.nome.trim().length < 2) {
      throw new ValidationException(
        "Nome é obrigatório e deve ter no mínimo 2 caracteres.",
        "nome"
      );
    }

    if (request.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email.trim())) {
      throw new ValidationException("Formato de email inválido.", "email");
    }

    if (request.dataNascimento) {
      const data = new Date(request.dataNascimento);
      if (isNaN(data.getTime())) {
        throw new ValidationException("Data de nascimento inválida.", "dataNascimento");
      }
      if (data > new Date()) {
        throw new ValidationException(
          "Data de nascimento não pode ser no futuro.",
          "dataNascimento"
        );
      }
    }
  }

  static async validarAtualizacao(request: AtualizarPacienteRequest): Promise<void> {
    if (!request.id) {
      throw new ValidationException("ID do paciente é obrigatório.", "id");
    }

    if (request.nome !== undefined && request.nome.trim().length < 2) {
      throw new ValidationException(
        "Nome deve ter no mínimo 2 caracteres.",
        "nome"
      );
    }

    if (request.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(request.email.trim())) {
      throw new ValidationException("Formato de email inválido.", "email");
    }
  }
}
