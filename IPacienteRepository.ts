// src/domain/paciente/repositories/IPacienteRepository.ts
import { Paciente } from "../entities/Paciente";

export interface IPacienteRepository {
  obterPorId(id: number): Promise<Paciente | null>;
  existe(id: number): Promise<boolean>;
}