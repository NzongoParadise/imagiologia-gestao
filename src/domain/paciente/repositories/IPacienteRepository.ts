import { Paciente } from "../entities/Paciente";
import { PacienteId } from "../value-objects/PacienteId";

export interface IPacienteRepository {
  findById(id: PacienteId | number | string): Promise<Paciente | null>;
  findByNumeroProcesso(numeroProcesso: string): Promise<Paciente | null>;
  findByDocumento(documento: string): Promise<Paciente | null>;
  findAll(filtros?: {
    termo?: string;
    limite?: number;
    offset?: number;
  }): Promise<Paciente[]>;
  save(paciente: Paciente): Promise<Paciente>;
  delete(id: PacienteId | number | string): Promise<void>;
  exists(id: PacienteId | number | string): Promise<boolean>;
  count(termo?: string): Promise<number>;
}
