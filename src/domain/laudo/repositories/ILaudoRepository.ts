import { Laudo } from "../entities/Laudo";
import { LaudoId } from "../value-objects/LaudoId";

export interface ILaudoRepository {
  findById(id: LaudoId | number | string): Promise<Laudo | null>;
  findByExameId(exameId: number): Promise<Laudo | null>;
  findByMedicoId(medicoId: number): Promise<Laudo[]>;
  findAll(filtros?: {
    assinado?: boolean;
    limite?: number;
    offset?: number;
  }): Promise<Laudo[]>;
  save(laudo: Laudo): Promise<Laudo>;
  delete(id: LaudoId | number | string): Promise<void>;
  exists(id: LaudoId | number | string): Promise<boolean>;
}
