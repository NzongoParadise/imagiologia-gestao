import { Atendimento, AtendimentoId, EstadoAtendimento, Senha } from "../domain/atendimento";
import { BusinessException } from "../domain/shared/exceptions/DomainException";

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void | Promise<void>): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => {
          console.log(`✅ ${name}`);
          testsPassed++;
        })
        .catch((error) => {
          console.error(`❌ ${name}:`, error.message);
          testsFailed++;
        });
    } else {
      console.log(`✅ ${name}`);
      testsPassed++;
    }
  } catch (error) {
    console.error(`❌ ${name}:`, (error as Error).message);
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
    toEqual(expected: any) {
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
  };
}

// Tests
test("should create EstadoAtendimento with initial state", () => {
  const estado = EstadoAtendimento.inicial();
  expect(estado.value).toBe("AGUARDANDO");
});

test("should transition from AGUARDANDO to TRIAGEM", () => {
  const estado = EstadoAtendimento.inicial();
  const novoEstado = estado.transitionTo("TRIAGEM");
  expect(novoEstado.value).toBe("TRIAGEM");
});

test("should prevent invalid state transition", () => {
  const estado = EstadoAtendimento.create("CONCLUIDO");
  expect(() => estado.transitionTo("TRIAGEM")).toThrow();
});

test("should create Senha with correct format", () => {
  const senha = Senha.create("C", 1);
  expect(senha.value).toBe("C-0001");
});

test("should create Atendimento aggregate", () => {
  const senha = Senha.create("C", 1);
  const atendimento = Atendimento.create({
    codigo: "AT-2026-CON-0001",
    senha,
    tipo: "CONSULTA",
    pacienteId: 1,
    especialidadeId: 1,
    prioridade: 1,
  });

  expect(atendimento.getCodigo()).toBe("AT-2026-CON-0001");
  expect(atendimento.getTipo()).toBe("CONSULTA");
  expect(atendimento.getPacienteId()).toBe(1);
  expect(atendimento.getEstado().value).toBe("AGUARDANDO");
});

test("should publish event when creating attendance", () => {
  const senha = Senha.create("C", 1);
  const atendimento = Atendimento.create({
    codigo: "AT-2026-CON-0001",
    senha,
    tipo: "CONSULTA",
    pacienteId: 1,
    especialidadeId: 1,
    prioridade: 1,
  });

  expect(atendimento.hasDomainEvents()).toBe(true);
  const events = atendimento.getDomainEvents();
  expect(events.length).toBe(1);
  expect(events[0].type).toBe("AtendimentoCriado");
});

test("should transition attendance to TRIAGEM", () => {
  const senha = Senha.create("C", 1);
  const atendimento = Atendimento.create({
    codigo: "AT-2026-CON-0001",
    senha,
    tipo: "CONSULTA",
    pacienteId: 1,
    especialidadeId: 1,
    prioridade: 1,
  });

  atendimento.iniciarTriagem();
  expect(atendimento.getEstado().value).toBe("TRIAGEM");
});

test("should start attendance with consultorio", () => {
  const senha = Senha.create("C", 1);
  const atendimento = Atendimento.create({
    codigo: "AT-2026-CON-0001",
    senha,
    tipo: "CONSULTA",
    pacienteId: 1,
    especialidadeId: 1,
    prioridade: 1,
  });

  atendimento.iniciarTriagem();
  atendimento.iniciarAtendimento(10);

  expect(atendimento.getEstado().value).toBe("EM_ATENDIMENTO");
  expect(atendimento.getConsultorioId()).toBe(10);
});

test("should complete attendance", () => {
  const senha = Senha.create("C", 1);
  const atendimento = Atendimento.create({
    codigo: "AT-2026-CON-0001",
    senha,
    tipo: "CONSULTA",
    pacienteId: 1,
    especialidadeId: 1,
    prioridade: 1,
  });

  atendimento.iniciarTriagem();
  atendimento.iniciarAtendimento(10);
  atendimento.concluir();

  expect(atendimento.getEstado().value).toBe("CONCLUIDO");
});

test("should cancel attendance with reason", () => {
  const senha = Senha.create("C", 1);
  const atendimento = Atendimento.create({
    codigo: "AT-2026-CON-0001",
    senha,
    tipo: "CONSULTA",
    pacienteId: 1,
    especialidadeId: 1,
    prioridade: 1,
  });

  atendimento.cancelar("Paciente desistiu");

  expect(atendimento.getEstado().value).toBe("CANCELADO");
  expect(atendimento.getMotivoCancelamento()).toBe("Paciente desistiu");
});

test("should prevent canceling completed attendance", () => {
  const senha = Senha.create("C", 1);
  const atendimento = Atendimento.create({
    codigo: "AT-2026-CON-0001",
    senha,
    tipo: "CONSULTA",
    pacienteId: 1,
    especialidadeId: 1,
    prioridade: 1,
  });

  atendimento.iniciarTriagem();
  atendimento.iniciarAtendimento(10);
  atendimento.concluir();

  expect(() => atendimento.cancelar("Desistiu")).toThrow();
});

console.log("\n==================================================");
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log("==================================================\n");
