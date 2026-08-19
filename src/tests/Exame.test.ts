import { Exame, ExameId, CodigoExame, EstadoExame, PrioridadeExame } from "../domain/exame";
import { SolicitarExameUseCase, AtualizarEstadoExameUseCase } from "../application/exame";
import { IExameRepository } from "../domain/exame";
import { ValidationException, BusinessException } from "../domain/shared/exceptions/DomainException";

let testsPassed = 0;
let testsFailed = 0;

async function runTest(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`✅ [Exame] ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ [Exame] ${name}:`, (error as Error).message);
    testsFailed++;
  }
}

function expect(actual: any) {
  return {
    toBe(expected: any) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toThrow(expectedErrorClass?: any) {
      if (typeof actual !== "function") {
        throw new Error("Expected a function");
      }
      let threw = false;
      try {
        actual();
      } catch (error) {
        threw = true;
        if (expectedErrorClass && !(error instanceof expectedErrorClass)) {
          throw new Error(`Expected error of type ${expectedErrorClass.name}, got ${error}`);
        }
      }
      if (!threw) {
        throw new Error("Expected function to throw");
      }
    },
  };
}

// In-Memory Repository for Exame
class InMemoryExameRepository implements IExameRepository {
  private items: Map<string, Exame> = new Map();

  async findById(id: ExameId | number | string): Promise<Exame | null> {
    const key = typeof id === "object" ? id.value : String(id);
    return this.items.get(key) ?? null;
  }

  async findByCodigo(codigo: string): Promise<Exame | null> {
    for (const ex of this.items.values()) {
      if (ex.getCodigo().value === codigo) return ex;
    }
    return null;
  }

  async findByPacienteId(pacienteId: number): Promise<Exame[]> {
    return Array.from(this.items.values()).filter((e) => e.getPacienteId() === pacienteId);
  }

  async findByEstado(estado: string): Promise<Exame[]> {
    return Array.from(this.items.values()).filter(
      (e) => e.getEstado().value.toLowerCase() === estado.toLowerCase()
    );
  }

  async findByTecnicoId(tecnicoId: number): Promise<Exame[]> {
    return Array.from(this.items.values()).filter((e) => e.getTecnicoId() === tecnicoId);
  }

  async findAll(): Promise<Exame[]> {
    return Array.from(this.items.values());
  }

  async save(exame: Exame): Promise<Exame> {
    this.items.set(exame.getId().value, exame);
    return exame;
  }

  async delete(id: ExameId | number | string): Promise<void> {
    const key = typeof id === "object" ? id.value : String(id);
    this.items.delete(key);
  }

  async exists(id: ExameId | number | string): Promise<boolean> {
    const key = typeof id === "object" ? id.value : String(id);
    return this.items.has(key);
  }

  async count(): Promise<number> {
    return this.items.size;
  }
}

async function main() {
  console.log("=== INICIANDO TESTES DO AGREGADO EXAME ===");

  await runTest("Deve criar Value Objects do Exame corretamente", () => {
    const cod = CodigoExame.create("RX-2026-1001");
    expect(cod.value).toBe("RX-2026-1001");

    const estado = EstadoExame.from("Solicitado");
    expect(estado.value).toBe("SOLICITADO");

    const prioridade = PrioridadeExame.from("Urgente");
    expect(prioridade.valor).toBe("URGENTE");
    expect(prioridade.nivel).toBe(2);
  });

  await runTest("Deve gerir transições válidas de estado no exame", () => {
    const estado = EstadoExame.inicial();
    expect(estado.value).toBe("SOLICITADO");

    const emRealizacao = estado.transitionTo("EM_REALIZACAO");
    expect(emRealizacao.value).toBe("EM_REALIZACAO");

    const realizado = emRealizacao.transitionTo("REALIZADO");
    expect(realizado.value).toBe("REALIZADO");

    const laudado = realizado.transitionTo("LAUDADO");
    expect(laudado.value).toBe("LAUDADO");
  });

  await runTest("Deve impedir transição inválida no exame", () => {
    const laudado = EstadoExame.from("Laudado");
    expect(() => laudado.transitionTo("EM_REALIZACAO")).toThrow(BusinessException);
  });

  await runTest("Deve criar entidade Exame e emitir evento ExameSolicitado", () => {
    const exame = Exame.solicitar({
      pacienteId: 1,
      tipoExameId: 5,
      modalidade: "TC",
      medicoSolicitante: "Dr. Manuel Santos",
      diagnosticoClinico: "Dor torácica atípica",
      prioridade: "URGENTE",
    });

    expect(exame.getPacienteId()).toBe(1);
    expect(exame.getTipoExameId()).toBe(5);
    expect(exame.getEstado().value).toBe("SOLICITADO");
    expect(exame.getPrioridade().valor).toBe("URGENTE");
    expect(exame.hasDomainEvents()).toBe(true);

    const eventos = exame.getDomainEvents();
    expect(eventos[0].type).toBe("ExameSolicitado");
  });

  await runTest("Deve realizar ciclo de vida completo do exame (iniciar -> concluir -> laudar)", () => {
    const exame = Exame.solicitar({
      pacienteId: 2,
      tipoExameId: 3,
    });
    exame.clearDomainEvents();

    exame.iniciarRealizacao(10);
    expect(exame.getEstado().value).toBe("EM_REALIZACAO");
    expect(exame.getTecnicoId()).toBe(10);

    exame.concluirRealizacao();
    expect(exame.getEstado().value).toBe("REALIZADO");

    exame.marcarComoLaudado(100);
    expect(exame.getEstado().value).toBe("LAUDADO");
    expect(exame.getDomainEvents().length).toBe(3);
  });

  await runTest("Deve cancelar exame com motivo", () => {
    const exame = Exame.solicitar({ pacienteId: 1, tipoExameId: 1 });
    exame.cancelar("Equipamento em manutenção");

    expect(exame.getEstado().value).toBe("CANCELADO");
    expect(exame.getObservacao()?.includes("Equipamento em manutenção")).toBe(true);
  });

  await runTest("Deve impedir alteração de dados clínicos em exame finalizado", () => {
    const exame = Exame.solicitar({ pacienteId: 1, tipoExameId: 1 });
    exame.iniciarRealizacao();
    exame.concluirRealizacao();
    exame.marcarComoLaudado(1);

    expect(() =>
      exame.atualizarDadosClinicos({ diagnosticoClinico: "Novo" })
    ).toThrow(BusinessException);
  });

  await runTest("Deve executar SolicitarExameUseCase com sucesso", async () => {
    const repo = new InMemoryExameRepository();
    const useCase = new SolicitarExameUseCase(repo);

    const result = await useCase.execute({
      pacienteId: 10,
      tipoExameId: 2,
      modalidade: "RX",
      medicoSolicitante: "Dra. Teresa",
      prioridade: "Normal",
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.pacienteId).toBe(10);
      expect(result.value.estado).toBe("SOLICITADO");
    }
  });

  await runTest("Deve executar AtualizarEstadoExameUseCase para concluir exame", async () => {
    const repo = new InMemoryExameRepository();
    const exame = Exame.solicitar({ id: "exame-1", pacienteId: 1, tipoExameId: 1 });
    exame.iniciarRealizacao(5);
    await repo.save(exame);

    const useCase = new AtualizarEstadoExameUseCase(repo);
    const result = await useCase.execute({
      id: "exame-1",
      acao: "CONCLUIR",
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.estado).toBe("REALIZADO");
    }
  });

  console.log(`\nResultados Exame: ${testsPassed} passaram, ${testsFailed} falharam.`);
  if (testsFailed > 0) process.exit(1);
}

main().catch(console.error);
