import { describe, it, expect, beforeEach } from "vitest";
import { createContainer, asClass, asValue } from "awilix";
import { CriarAtendimentoUseCase } from "../CriarAtendimentoUseCase";
import { CriarAtendimentoValidator } from "@/application/atendimento/validators/CriarAtendimentoValidator";
import { InMemoryAtendimentoRepository } from "@/infrastructure/persistence/repositories/InMemoryAtendimentoRepository";
import { MockPacienteRepository } from "@/infrastructure/persistence/repositories/MockPacienteRepository";
import { MockEspecialidadeRepository } from "@/infrastructure/persistence/repositories/MockEspecialidadeRepository";
import { MockConsultorioRepository } from "@/infrastructure/persistence/repositories/MockConsultorioRepository";
import { EventBus } from "@/infrastructure/events/EventBus";
import { Logger } from "@/infrastructure/logging/Logger";

describe("CriarAtendimentoUseCase Integration Test", () => {
  let container: any;
  let atendimentoRepository: InMemoryAtendimentoRepository;

  beforeEach(() => {
    // Criamos um novo container para cada teste para garantir o isolamento
    container = createContainer();
    atendimentoRepository = new InMemoryAtendimentoRepository();

    // Registramos as dependências, usando as implementações em memória/mock
    container.register({
      // Para o teste, usamos o repositório em memória
      atendimentoRepository: asValue(atendimentoRepository),
      pacienteRepository: asClass(MockPacienteRepository).singleton(),
      especialidadeRepository: asClass(MockEspecialidadeRepository).singleton(),
      consultorioRepository: asClass(MockConsultorioRepository).singleton(),

      criarAtendimentoUseCase: asClass(CriarAtendimentoUseCase),
      criarAtendimentoValidator: asClass(CriarAtendimentoValidator),

      eventBus: asClass(EventBus).singleton(),
      logger: asClass(Logger).singleton(),
    });
  });

  it("deve criar um atendimento com sucesso e persisti-lo", async () => {
    // Arrange
    const useCase = container.resolve<CriarAtendimentoUseCase>(
      "criarAtendimentoUseCase"
    );
    const request = {
      pacienteId: 1, // MockPacienteRepository retorna sucesso para ID 1
      especialidadeId: 1, // MockEspecialidadeRepository retorna sucesso para ID 1
      tipo: "CONSULTA" as const,
      prioridade: "Normal" as const,
      usuarioId: 1,
    };

    // Act
    const resultado = await useCase.execute(request);

    // Assert
    // 1. Verificar se o resultado foi um sucesso
    expect(resultado.isSuccess()).toBe(true);

    // 2. Verificar se a resposta contém os dados esperados
    if (resultado.isSuccess()) {
      const response = resultado.value;
      expect(response.atendimentoId).toBeDefined();
      expect(response.codigo).toMatch(/^AT-\d{4}-CON-\d{4}$/);
      expect(response.senha).toBe("C-001");
      expect(response.estado).toBe("Aguardando");
    }

    // 3. Verificar se o atendimento foi realmente salvo no repositório em memória
    expect(atendimentoRepository.items).toHaveLength(1);
    const atendimentoSalvo = atendimentoRepository.items[0];
    expect(atendimentoSalvo.getPacienteId()).toBe(request.pacienteId);
    expect(atendimentoSalvo.getEspecialidadeId()).toBe(request.especialidadeId);
    expect(atendimentoSalvo.getEstado().getValue()).toBe("AGUARDANDO");
  });

  it("deve retornar um erro de validação se o paciente não existir", async () => {
    // Arrange
    const useCase = container.resolve<CriarAtendimentoUseCase>(
      "criarAtendimentoUseCase"
    );
    const request = {
      pacienteId: 999, // ID que não existe no MockPacienteRepository
      especialidadeId: 1,
      tipo: "CONSULTA" as const,
      usuarioId: 1,
    };

    // Act
    const resultado = await useCase.execute(request);

    // Assert
    // 1. Verificar se o resultado foi uma falha
    expect(resultado.isFailure()).toBe(true);

    // 2. Verificar o tipo e a mensagem do erro
    if (resultado.isFailure()) {
      const error = resultado.error;
      expect(error.statusCode).toBe(400); // ValidationException
      expect(error.message).toBe("Paciente não encontrado");
      expect(error.field).toBe("pacienteId");
    }

    // 3. Garantir que nada foi salvo no repositório
    expect(atendimentoRepository.items).toHaveLength(0);
  });
});