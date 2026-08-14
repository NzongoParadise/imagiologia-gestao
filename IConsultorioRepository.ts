// src/domain/consultorio/repositories/IConsultorioRepository.ts
export interface IConsultorioRepository {
  obterPorId(id: number): Promise<any | null>; // Substituir 'any' pela entidade Consultorio real
  estaOcupado(id: number): Promise<boolean>;
}