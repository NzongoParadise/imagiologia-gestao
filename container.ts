import { createContainer, asClass } from "awilix";

// Domain Repositories Interfaces
import { IAtendimentoRepository } from "@/domain/atendimento/repositories/IAtendimentoRepository";
import { IPacienteRepository } from "@/domain/paciente/repositories/IPacienteRepository";
import { IEspecialidadeRepository } from "@/domain/especialidade/repositories/IEspecialidadeRepository";
import { IConsultorioRepository } from "@/domain/consultorio/repositories/IConsultorioRepository";

// Infrastructure Implementations
import { AtendimentoRepository } from "@/infrastructure/persistence/repositories/AtendimentoRepository";
import { MockPacienteRepository } from "@/infrastructure/persistence/repositories/MockPacienteRepository";
import { MockEspecialidadeRepository } from "@/infrastructure/persistence/repositories/MockEspecialidadeRepository";
import { MockConsultorioRepository } from "@/infrastructure/persistence/repositories/MockConsultorioRepository";

// Application Use Cases
import { CriarAtendimentoUseCase } from "@/application/atendimento/use-cases/criar-atendimento/CriarAtendimentoUseCase";

// Application Validators
import { CriarAtendimentoValidator } from "@/application/atendimento/validators/CriarAtendimentoValidator";

// Infrastructure Services
import { EventBus } from "@/infrastructure/events/EventBus";
import { Logger } from "@/infrastructure/logging/Logger";

const container = createContainer();

container.register({
  // Repositórios
  atendimentoRepository: asClass(AtendimentoRepository).singleton(),
  pacienteRepository: asClass(MockPacienteRepository).singleton(),
  especialidadeRepository: asClass(MockEspecialidadeRepository).singleton(),
  consultorioRepository: asClass(MockConsultorioRepository).singleton(),

  // Use Cases
  criarAtendimentoUseCase: asClass(CriarAtendimentoUseCase).singleton(),

  // Validadores
  criarAtendimentoValidator: asClass(CriarAtendimentoValidator).singleton(),

  // Serviços de Infraestrutura
  eventBus: asClass(EventBus).singleton(),
  // Para o Logger, registramos a classe em si.
  // Assumimos que as chamadas internas a Logger.getLogger() continuarão a ser feitas.
  // Uma configuração mais avançada poderia envolver uma factory de logger ou a injeção de uma instância específica.
  logger: asClass(Logger).singleton(),
});

export { container };