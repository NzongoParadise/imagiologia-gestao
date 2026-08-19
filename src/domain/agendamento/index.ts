// Value Objects
export { AgendamentoId } from "./value-objects/AgendamentoId";
export { EstadoAgendamento, type EstadoAgendamentoType } from "./value-objects/EstadoAgendamento";
export { SlotHorario } from "./value-objects/SlotHorario";

// Entities
export { Agendamento, type AgendamentoProps } from "./entities/Agendamento";

// Events
export type {
  AgendamentoCriadoEvent,
  AgendamentoConfirmadoEvent,
  PacienteChegouEvent,
  AgendamentoConcluidoEvent,
  AgendamentoCanceladoEvent,
  AgendamentoReagendadoEvent,
} from "./events/AgendamentoEvents";

// Repositories
export type { IAgendamentoRepository } from "./repositories/IAgendamentoRepository";
