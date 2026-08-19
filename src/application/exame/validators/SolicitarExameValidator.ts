import { SolicitarExameRequest, AtualizarEstadoExameRequest } from "../dto/ExameDTOs";
import { ValidationException } from "../../../domain/shared/exceptions/DomainException";

export class SolicitarExameValidator {
  static async validar(request: SolicitarExameRequest): Promise<void> {
    if (!request.pacienteId || Number(request.pacienteId) <= 0) {
      throw new ValidationException(
        "ID do paciente é obrigatório e deve ser maior que zero.",
        "pacienteId"
      );
    }

    if (!request.tipoExameId || Number(request.tipoExameId) <= 0) {
      throw new ValidationException(
        "ID do tipo de exame é obrigatório e deve ser maior que zero.",
        "tipoExameId"
      );
    }

    if (request.codigo && request.codigo.trim().length < 3) {
      throw new ValidationException(
        "Código do exame deve conter no mínimo 3 caracteres.",
        "codigo"
      );
    }
  }

  static async validarAtualizacaoEstado(request: AtualizarEstadoExameRequest): Promise<void> {
    if (!request.id) {
      throw new ValidationException("ID do exame é obrigatório.", "id");
    }

    const acoesValidas = ["INICIAR", "CONCLUIR", "LAUDAR", "CANCELAR"];
    if (!acoesValidas.includes(request.acao)) {
      throw new ValidationException(
        `Ação inválida: ${request.acao}. Valores permitidos: ${acoesValidas.join(", ")}`,
        "acao"
      );
    }

    if (request.acao === "LAUDAR" && !request.laudoId) {
      throw new ValidationException(
        "ID do laudo é obrigatório para marcar exame como laudado.",
        "laudoId"
      );
    }
  }
}
