import { Atendimento, Senha, EstadoAtendimento, AtendimentoId } from "../../../domain/atendimento";
import { CriarAtendimentoValidator } from "../validators/CriarAtendimentoValidator";
import { CriarAtendimentoRequest, mapAtendimentoToResponse, AtendimentoResponse } from "../dto";
import { Result, Ok, Err } from "../../../domain/shared";
import { DomainException } from "../../../domain/shared/exceptions/DomainException";

/**
 * CriarAtendimentoUseCase
 * Application service for creating new attendance
 * 
 * Input: CriarAtendimentoRequest
 * Output: Result<AtendimentoResponse, Error>
 */
export class CriarAtendimentoUseCase {
  /**
   * Constructor (dependency injection would go here)
   */
  constructor(
    // private atendimentoRepository: IAtendimentoRepository,
    // private logger: Logger
  ) {}

  /**
   * Execute the use case
   */
  async execute(request: CriarAtendimentoRequest): Promise<Result<AtendimentoResponse>> {
    try {
      // 1. Validation
      await CriarAtendimentoValidator.validar(request);

      // 2. Generate codigo and senha
      const codigo = this.gerarCodigo(request.tipo);
      const senhaNumero = this.gerarNumeroSenha();
      const senha = Senha.create(
        request.tipo === "CONSULTA" ? "C" : "U",
        senhaNumero
      );

      // 3. Create aggregate root
      const atendimento = Atendimento.create({
        codigo,
        senha,
        tipo: request.tipo,
        pacienteId: request.pacienteId,
        especialidadeId: request.especialidadeId,
        prioridade: request.prioridade,
      });

      // 4. Persist (would call repository)
      // await this.atendimentoRepository.salvar(atendimento);

      // 5. Publish events (would call event bus)
      // const events = atendimento.getDomainEvents();
      // await this.eventBus.publishAll(events);
      // atendimento.clearDomainEvents();

      // 6. Map to DTO and return
      const response = mapAtendimentoToResponse(atendimento);
      return Ok(response);

    } catch (error) {
      if (error instanceof DomainException) {
        // Log the error
        // this.logger.error("Erro ao criar atendimento", error, { request });
        return Err(error);
      }

      // Unexpected error
      return Err(
        new Error(`Erro inesperado ao criar atendimento: ${String(error)}`)
      );
    }
  }

  /**
   * Generate attendance code (e.g., AT-2026-CON-0001)
   */
  private gerarCodigo(tipo: "CONSULTA" | "URGENCIA"): string {
    const ano = new Date().getFullYear();
    const tipoSigla = tipo === "CONSULTA" ? "CON" : "URG";
    const numero = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `AT-${ano}-${tipoSigla}-${numero}`;
  }

  /**
   * Generate sequential ticket number
   */
  private gerarNumeroSenha(): number {
    // TODO: Would use a sequence generator or counter from database
    return Math.floor(Math.random() * 9999) + 1;
  }
}
