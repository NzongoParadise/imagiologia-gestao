// src/infrastructure/persistence/repositories/MockConsultorioRepository.ts
import { IConsultorioRepository } from "@/domain/consultorio/repositories/IConsultorioRepository";

export class MockConsultorioRepository implements IConsultorioRepository {
  async obterPorId(id: number): Promise<any | null> {
    // Simula a busca por um consultório
    if (id === 1) {
      return { id: 1, nome: "Consultório 1" };
    }
    return null;
  }

  async estaOcupado(id: number): Promise<boolean> {
    return false; // Simula que o consultório nunca está ocupado por enquanto
  }
}