import { Atendimento } from "../../../domain/atendimento/entities/Atendimento";
import { EstadoType } from "../../../domain/atendimento/value-objects/EstadoAtendimento";
import { IRepository } from "./IRepository";

/**
 * IAtendimentoRepository - Specific repository interface for Atendimento aggregate
 * Extends generic IRepository with domain-specific queries
 */
export interface IAtendimentoRepository extends IRepository<Atendimento> {
  /**
   * Find attendance by code
   */
  findByCodigo(codigo: string): Promise<Atendimento | null>;

  /**
   * Find all attendances for a patient
   */
  findByPacienteId(pacienteId: number): Promise<Atendimento[]>;

  /**
   * Find all attendances by status
   */
  findByEstado(estado: EstadoType): Promise<Atendimento[]>;

  /**
   * Find active attendances (not cancelled, not concluded)
   */
  findAtivas(): Promise<Atendimento[]>;

  /**
   * Find attendances by specialty
   */
  findByEspecialidade(especialidadeId: number): Promise<Atendimento[]>;

  /**
   * Find attendances in a specific office
   */
  findByConsultorio(consultorioId: number): Promise<Atendimento[]>;

  /**
   * Find attendances by type (CONSULTA or URGENCIA)
   */
  findByTipo(tipo: "CONSULTA" | "URGENCIA"): Promise<Atendimento[]>;

  /**
   * Get next attendance in queue
   */
  getProximo(especialidadeId?: number, consultorioId?: number): Promise<Atendimento | null>;

  /**
   * Get queue statistics
   */
  getEstatisticas(): Promise<{
    total: number;
    ativas: number;
    canceladas: number;
    concluidas: number;
    emTriagem: number;
    emAtendimento: number;
    emConclusao: number;
  }>;
}
