// src/infrastructure/persistence/repositories/MockEspecialidadeRepository.ts
import { IEspecialidadeRepository } from "@/domain/especialidade/repositories/IEspecialidadeRepository";

export class MockEspecialidadeRepository implements IEspecialidadeRepository {
  async obterPorId(id: number): Promise<any | null> {
    // Simula a busca por uma especialidade
    if (id === 1) {
      return { id: 1, nome: "Cardiologia", ativo: true };
    }
    return null;
  }

  async estaAitiva(id: number): Promise<boolean> {
    return id === 1; // Simula que a especialidade com ID 1 está ativa
  }
}