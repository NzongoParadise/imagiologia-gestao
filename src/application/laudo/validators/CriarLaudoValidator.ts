import { CriarLaudoRequest, AssinarLaudoRequest } from "../dto/LaudoDTOs";
import { ValidationException } from "../../../domain/shared/exceptions/DomainException";

export class CriarLaudoValidator {
  static async validar(request: CriarLaudoRequest): Promise<void> {
    if (!request.exameId || Number(request.exameId) <= 0) {
      throw new ValidationException(
        "ID do exame é obrigatório e deve ser maior que zero.",
        "exameId"
      );
    }

    if (!request.conteudo) {
      throw new ValidationException(
        "O conteúdo do laudo é obrigatório.",
        "conteudo"
      );
    }
  }
}

export class AssinarLaudoValidator {
  static async validar(request: AssinarLaudoRequest): Promise<void> {
    if (!request.id) {
      throw new ValidationException("ID do laudo é obrigatório.", "id");
    }

    if (!request.medicoId || Number(request.medicoId) <= 0) {
      throw new ValidationException(
        "ID do médico que assina o laudo é obrigatório.",
        "medicoId"
      );
    }
  }
}
