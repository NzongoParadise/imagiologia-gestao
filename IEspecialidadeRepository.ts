// src/domain/especialidade/repositories/IEspecialidadeRepository.ts
export interface IEspecialidadeRepository {
  obterPorId(id: number): Promise<any | null>; // Substituir 'any' pela entidade Especialidade real
  estaAitiva(id: number): Promise<boolean>;
}