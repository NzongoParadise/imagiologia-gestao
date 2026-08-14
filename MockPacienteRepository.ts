// src/infrastructure/persistence/repositories/MockPacienteRepository.ts
import { IPacienteRepository } from "@/domain/paciente/repositories/IPacienteRepository";

export class MockPacienteRepository implements IPacienteRepository {
  async obterPorId(id: number): Promise<any | null> {
    // Simula a busca por um paciente
    if (id === 1) {
      return { id: 1, nome: "Paciente Teste" };
    }
    return null;
  }

  async existe(id: number): Promise<boolean> {
    return id === 1; // Simula que o paciente com ID 1 existe
  }
}