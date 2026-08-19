import { Paciente, PacienteId, NumeroProcesso, Contacto, DocumentoIdentificacao } from "../domain/paciente";
import { RegistarPacienteUseCase, AtualizarPacienteUseCase } from "../application/paciente";
import { IPacienteRepository } from "../domain/paciente";
import { ValidationException, BusinessException } from "../domain/shared/exceptions/DomainException";

let testsPassed = 0;
let testsFailed = 0;

async function runTest(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`✅ [Paciente] ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ [Paciente] ${name}:`, (error as Error).message);
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

// In-Memory Repository for testing
class InMemoryPacienteRepository implements IPacienteRepository {
  private items: Map<string, Paciente> = new Map();

  async findById(id: PacienteId | number | string): Promise<Paciente | null> {
    const key = typeof id === "object" ? id.value : String(id);
    return this.items.get(key) ?? null;
  }

  async findByNumeroProcesso(numeroProcesso: string): Promise<Paciente | null> {
    for (const p of this.items.values()) {
      if (p.getNumeroProcesso().value === numeroProcesso) return p;
    }
    return null;
  }

  async findByDocumento(documento: string): Promise<Paciente | null> {
    for (const p of this.items.values()) {
      const doc = p.getDocumento();
      if (doc.bi === documento || doc.nif === documento || doc.documentoOutro === documento) return p;
    }
    return null;
  }

  async findAll(): Promise<Paciente[]> {
    return Array.from(this.items.values());
  }

  async save(paciente: Paciente): Promise<Paciente> {
    this.items.set(paciente.getId().value, paciente);
    return paciente;
  }

  async delete(id: PacienteId | number | string): Promise<void> {
    const key = typeof id === "object" ? id.value : String(id);
    this.items.delete(key);
  }

  async exists(id: PacienteId | number | string): Promise<boolean> {
    const key = typeof id === "object" ? id.value : String(id);
    return this.items.has(key);
  }

  async count(): Promise<number> {
    return this.items.size;
  }
}

async function main() {
  console.log("=== INICIANDO TESTES DO AGREGADO PACIENTE ===");

  await runTest("Deve criar Value Objects do Paciente corretamente", () => {
    const num = NumeroProcesso.create("PROC-2026-0001");
    expect(num.value).toBe("PROC-2026-0001");

    const contacto = Contacto.create({ telefone: "923456789", email: "paciente@hospital.com" });
    expect(contacto.telefone).toBe("923456789");
    expect(contacto.email).toBe("paciente@hospital.com");

    const doc = DocumentoIdentificacao.create({ bi: "001234567LA042", nif: "500123456" });
    expect(doc.bi).toBe("001234567LA042");
    expect(doc.nif).toBe("500123456");
  });

  await runTest("Deve lançar erro para email inválido no Value Object Contacto", () => {
    expect(() => Contacto.create({ email: "invalido" })).toThrow(ValidationException);
  });

  await runTest("Deve criar entidade Paciente e emitir evento PacienteRegistado", () => {
    const paciente = Paciente.criar({
      nome: "Carlos Silva",
      numeroProcesso: "PROC-2026-100",
      dataNascimento: new Date(1990, 4, 15),
      sexo: "Masculino",
      telefone: "912345678",
      email: "carlos@hospital.com",
    });

    expect(paciente.getNome()).toBe("Carlos Silva");
    expect(paciente.getNumeroProcesso().value).toBe("PROC-2026-100");
    expect(paciente.hasDomainEvents()).toBe(true);
    const eventos = paciente.getDomainEvents();
    expect(eventos[0].type).toBe("PacienteRegistado");
  });

  await runTest("Deve calcular idade corretamente", () => {
    const ref = new Date(2026, 0, 1);
    const paciente = Paciente.criar({
      nome: "Maria Santos",
      dataNascimento: new Date(2000, 0, 1),
    });
    expect(paciente.calcularIdade(ref)).toBe(26);
  });

  await runTest("Deve falhar ao criar paciente com nome muito curto", () => {
    expect(() => Paciente.criar({ nome: "A" })).toThrow(ValidationException);
  });

  await runTest("Deve falhar ao criar paciente com data de nascimento no futuro", () => {
    const futuro = new Date(Date.now() + 86400000 * 10);
    expect(() => Paciente.criar({ nome: "Futuro", dataNascimento: futuro })).toThrow(ValidationException);
  });

  await runTest("Deve atualizar dados e contactos emitindo evento PacienteAtualizado", () => {
    const paciente = Paciente.criar({ nome: "António Manuel" });
    paciente.clearDomainEvents();

    paciente.atualizarDados({ nome: "António Manuel Pereira" });
    paciente.atualizarContacto("933333333", "antonio@hospital.com");

    expect(paciente.getNome()).toBe("António Manuel Pereira");
    expect(paciente.getContacto().telefone).toBe("933333333");
    expect(paciente.getDomainEvents().length).toBe(2);
  });

  await runTest("Deve executar RegistarPacienteUseCase com sucesso", async () => {
    const repo = new InMemoryPacienteRepository();
    const useCase = new RegistarPacienteUseCase(repo);

    const result = await useCase.execute({
      nome: "Beatriz Costa",
      numeroProcesso: "PROC-2026-200",
      email: "beatriz@hospital.com",
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.nome).toBe("Beatriz Costa");
      expect(result.value.numeroProcesso).toBe("PROC-2026-200");
    }
  });

  await runTest("Deve impedir registo com número de processo duplicado no UseCase", async () => {
    const repo = new InMemoryPacienteRepository();
    const useCase = new RegistarPacienteUseCase(repo);

    await useCase.execute({
      nome: "Beatriz Costa",
      numeroProcesso: "PROC-2026-200",
    });

    const resultDuplicado = await useCase.execute({
      nome: "Outro Paciente",
      numeroProcesso: "PROC-2026-200",
    });

    expect(resultDuplicado.isFailure()).toBe(true);
    if (resultDuplicado.isFailure()) {
      expect(resultDuplicado.error instanceof BusinessException).toBe(true);
    }
  });

  await runTest("Deve executar AtualizarPacienteUseCase com sucesso", async () => {
    const repo = new InMemoryPacienteRepository();
    const paciente = Paciente.criar({
      id: "paciente-1",
      nome: "Nome Antigo",
    });
    await repo.save(paciente);

    const useCase = new AtualizarPacienteUseCase(repo);
    const result = await useCase.execute({
      id: "paciente-1",
      nome: "Nome Novo Atualizado",
      telefone: "944444444",
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.nome).toBe("Nome Novo Atualizado");
      expect(result.value.telefone).toBe("944444444");
    }
  });

  console.log(`\nResultados Paciente: ${testsPassed} passaram, ${testsFailed} falharam.`);
  if (testsFailed > 0) process.exit(1);
}

main().catch(console.error);
