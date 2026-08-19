// Value Objects
export { ExameId } from "./value-objects/ExameId";
export { CodigoExame } from "./value-objects/CodigoExame";
export { EstadoExame, type EstadoExameType } from "./value-objects/EstadoExame";
export { PrioridadeExame, type PrioridadeExameType } from "./value-objects/PrioridadeExame";

// Entities
export { Exame, type ExameProps } from "./entities/Exame";

// Events
export type {
  ExameSolicitadoEvent,
  ExameIniciadoEvent,
  ExameRealizadoEvent,
  ExameLaudadoEvent,
  ExameCanceladoEvent,
} from "./events/ExameEvents";

// Repositories
export type { IExameRepository } from "./repositories/IExameRepository";
