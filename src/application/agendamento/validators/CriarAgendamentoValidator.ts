import { CriarAgendamentoRequest } from "../dto/AgendamentoDTOs";
import { ValidationException } from "../../../domain/shared/exceptions/DomainException";

export class CriarAgendamentoValidator {
  static async validar(request: CriarAgendamentoRequest): Promise<void> {
    if (!request.pacienteId || Number(request.pacienteId) <= 0) {
      throw new ValidationException(
        "ID do paciente é obrigatório e deve ser maior que zero.",
        "pacienteId"
      );
    }

    if (!request.dataHora) {
      throw new ValidationException(
        "Data e hora do agendamento são obrigatórias.",
        "dataHora"
      );
    }

    const data = new Date(request.dataHora);
    if (isNaN(data.getTime())) {
      throw new ValidationException("Data e hora inválidas.", "dataHora");
    }

    if (request.duracaoMin !== undefined && (request.duracaoMin < 5 || request.duracaoMin > 480)) {
      throw new ValidationException(
        "A duração do agendamento deve estar entre 5 e 480 minutos.",
        "duracaoMin"
      );
    }
  }
}
