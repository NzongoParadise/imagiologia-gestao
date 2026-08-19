import { Agendamento } from "../entities/Agendamento";
import { AgendamentoId } from "../value-objects/AgendamentoId";

export interface IAgendamentoRepository {
  findById(id: AgendamentoId | number | string): Promise<Agendamento | null>;
  findByPacienteId(pacienteId: number): Promise<Agendamento[]>;
  findByMedicoId(medicoId: number, data?: Date): Promise<Agendamento[]>;
  findByConsultorioId(consultorioId: number, data?: Date): Promise<Agendamento[]>;
  findByEstado(estado: string): Promise<Agendamento[]>;
  findByIntervalo(inicio: Date, fim: Date): Promise<Agendamento[]>;
  findAll(filtros?: {
    pacienteId?: number;
    medicoId?: number;
    consultorioId?: number;
    especialidadeId?: number;
    estado?: string;
    limite?: number;
    offset?: number;
  }): Promise<Agendamento[]>;
  save(agendamento: Agendamento): Promise<Agendamento>;
  delete(id: AgendamentoId | number | string): Promise<void>;
  exists(id: AgendamentoId | number | string): Promise<boolean>;
}
