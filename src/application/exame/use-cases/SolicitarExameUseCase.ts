import { Exame, IExameRepository } from "../../../domain/exame";
import { SolicitarExameRequest, ExameResponse, mapExameToResponse } from "../dto/ExameDTOs";
import { SolicitarExameValidator } from "../validators/SolicitarExameValidator";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException, BusinessException } from "../../../domain/shared/exceptions/DomainException";

export class SolicitarExameUseCase {
  constructor(private readonly exameRepository?: IExameRepository) {}

  async execute(request: SolicitarExameRequest): Promise<Result<ExameResponse>> {
    try {
      await SolicitarExameValidator.validar(request);

      if (this.exameRepository && request.codigo) {
        const existente = await this.exameRepository.findByCodigo(request.codigo);
        if (existente) {
          throw new BusinessException(
            `Já existe um exame registado com o código ${request.codigo}.`,
            "CODIGO_EXAME_DUPLICADO",
            { codigo: request.codigo }
          );
        }
      }

      const exame = Exame.solicitar({
        codigo: request.codigo,
        modalidade: request.modalidade,
        pacienteId: Number(request.pacienteId),
        tipoExameId: Number(request.tipoExameId),
        tecnicoId: request.tecnicoId ? Number(request.tecnicoId) : undefined,
        procedenciaId: request.procedenciaId ? Number(request.procedenciaId) : undefined,
        medicoSolicitante: request.medicoSolicitante,
        observacao: request.observacao,
        diagnosticoClinico: request.diagnosticoClinico,
        justificacaoClinica: request.justificacaoClinica,
        prioridade: request.prioridade,
        dataExame: request.dataExame ? new Date(request.dataExame) : undefined,
      });

      let salvo = exame;
      if (this.exameRepository) {
        salvo = await this.exameRepository.save(exame);
      }

      return Ok(mapExameToResponse(salvo));
    } catch (error) {
      if (error instanceof DomainException) {
        return Err(error);
      }
      return Err(new Error(`Erro inesperado ao solicitar exame: ${String(error)}`));
    }
  }
}
