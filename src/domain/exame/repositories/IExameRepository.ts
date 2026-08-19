import { Exame } from "../entities/Exame";
import { ExameId } from "../value-objects/ExameId";

export interface IExameRepository {
  findById(id: ExameId | number | string): Promise<Exame | null>;
  findByCodigo(codigo: string): Promise<Exame | null>;
  findByPacienteId(pacienteId: number): Promise<Exame[]>;
  findByEstado(estado: string): Promise<Exame[]>;
  findByTecnicoId(tecnicoId: number): Promise<Exame[]>;
  findAll(filtros?: {
    pacienteId?: number;
    estado?: string;
    limite?: number;
    offset?: number;
  }): Promise<Exame[]>;
  save(exame: Exame): Promise<Exame>;
  delete(id: ExameId | number | string): Promise<void>;
  exists(id: ExameId | number | string): Promise<boolean>;
  count(filtros?: { estado?: string; pacienteId?: number }): Promise<number>;
}
