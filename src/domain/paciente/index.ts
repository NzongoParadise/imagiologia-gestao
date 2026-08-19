// Value Objects
export { PacienteId } from "./value-objects/PacienteId";
export { NumeroProcesso } from "./value-objects/NumeroProcesso";
export { Contacto } from "./value-objects/Contacto";
export { DocumentoIdentificacao } from "./value-objects/DocumentoIdentificacao";

// Entities
export { Paciente, type PacienteProps } from "./entities/Paciente";

// Events
export type {
  PacienteRegistadoEvent,
  PacienteAtualizadoEvent,
  PacienteObservacaoAdicionadaEvent,
} from "./events/PacienteEvents";

// Repositories
export type { IPacienteRepository } from "./repositories/IPacienteRepository";
