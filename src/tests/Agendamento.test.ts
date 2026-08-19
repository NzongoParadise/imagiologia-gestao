import { Agendamento, AgendamentoId, EstadoAgendamento, SlotHorario } from "../domain/agendamento";
import { CriarAgendamentoUseCase, ConfirmarAgendamentoUseCase, RegistarChegadaAgendamentoUseCase } from "../application/agendamento";
import { IAgendamentoRepository } from "../domain/agendamento";
import { ValidationException, BusinessException } from "../domain/shared/exceptions/DomainException";

let testsPassed = 0;
let testsFailed = 0;

async function runTest(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`✅ [Agendamento] ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ [Agendamento] ${name}:`, (error as Error).message);
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

// In-Memory Repository for Agendamento
class InMemoryAgendamentoRepository implements IAgendamentoRepository {
  private items: Map<string, Agendamento> = new Map();

  async findById(id: AgendamentoId | number | string): Promise<Agendamento | null> {
    const key = typeof id === "object" ? id.value : String(id);
    return this.items.get(key) ?? null;
  }

  async findByPacienteId(pacienteId: number): Promise<Agendamento[]> {
    return Array.from(this.items.values()).filter((a) => a.getPacienteId() === pacienteId);
  }

  async findByMedicoId(medicoId: number, data?: Date): Promise<Agendamento[]> {
    return Array.from(this.items.values()).filter((a) => {
      if (a.getMedicoId() !== medicoId) return false;
      if (!data) return true;
      return a.getDataHora().toDateString() === data.toDateString();
    });
  }

  async findByConsultorioId(consultorioId: number): Promise<Agendamento[]> {
    return Array.from(this.items.values()).filter((a) => a.getConsultorioId() === consultorioId);
  }

  async findByEstado(estado: string): Promise<Agendamento[]> {
    return Array.from(this.items.values()).filter(
      (a) => a.getEstado().value.toLowerCase() === estado.toLowerCase()
    );
  }

  async findByIntervalo(inicio: Date, fim: Date): Promise<Agendamento[]> {
    return Array.from(this.items.values()).filter((a) => {
      const hora = a.getDataHora();
      return hora >= inicio && hora <= fim;
    });
  }

  async findAll(): Promise<Agendamento[]> {
    return Array.from(this.items.values());
  }

  async save(agendamento: Agendamento): Promise<Agendamento> {
    this.items.set(agendamento.getId().value, agendamento);
    return agendamento;
  }

  async delete(id: AgendamentoId | number | string): Promise<void> {
    const key = typeof id === "object" ? id.value : String(id);
    this.items.delete(key);
  }

  async exists(id: AgendamentoId | number | string): Promise<boolean> {
    const key = typeof id === "object" ? id.value : String(id);
    return this.items.has(key);
  }
}

async function main() {
  console.log("=== INICIANDO TESTES DO AGREGADO AGENDAMENTO ===");

  await runTest("Deve criar Value Objects de Agendamento corretamente", () => {
    const inicio = new Date(2026, 5, 10, 14, 0, 0);
    const slot = SlotHorario.create(inicio, 45);

    expect(slot.duracaoMin).toBe(45);
    expect(slot.fim.getTime()).toBe(inicio.getTime() + 45 * 60000);

    const estado = EstadoAgendamento.from("AGENDADO");
    expect(estado.value).toBe("AGENDADO");
  });

  await runTest("Deve detetar sobreposição de horários entre slots", () => {
    const slotA = SlotHorario.create(new Date(2026, 5, 10, 10, 0), 30); // 10:00 - 10:30
    const slotB = SlotHorario.create(new Date(2026, 5, 10, 10, 15), 30); // 10:15 - 10:45 (sobrepõe)
    const slotC = SlotHorario.create(new Date(2026, 5, 10, 10, 30), 30); // 10:30 - 11:00 (não sobrepõe)

    expect(slotA.sobrepoe(slotB)).toBe(true);
    expect(slotA.sobrepoe(slotC)).toBe(false);
  });

  await runTest("Deve criar entidade Agendamento e emitir evento AgendamentoCriado", () => {
    const agendamento = Agendamento.agendar({
      pacienteId: 1,
      medicoId: 3,
      dataHora: new Date(2026, 8, 1, 9, 30),
      duracaoMin: 30,
      observacoes: "Primeira consulta de cardiologia",
    });

    expect(agendamento.getPacienteId()).toBe(1);
    expect(agendamento.getMedicoId()).toBe(3);
    expect(agendamento.getEstado().value).toBe("AGENDADO");
    expect(agendamento.hasDomainEvents()).toBe(true);
    expect(agendamento.getDomainEvents()[0].type).toBe("AgendamentoCriado");
  });

  await runTest("Deve gerir ciclo de vida do agendamento (confirmar -> chegou -> concluir)", () => {
    const agendamento = Agendamento.agendar({
      pacienteId: 2,
      dataHora: new Date(2026, 8, 1, 11, 0),
    });
    agendamento.clearDomainEvents();

    agendamento.confirmar();
    expect(agendamento.getEstado().value).toBe("CONFIRMADO");

    agendamento.registarChegada();
    expect(agendamento.getEstado().value).toBe("CHEGOU");

    agendamento.concluir(50);
    expect(agendamento.getEstado().value).toBe("CONCLUIDO");
    expect(agendamento.getAtendimentoId()).toBe(50);
    expect(agendamento.getDomainEvents().length).toBe(3);
  });

  await runTest("Deve cancelar agendamento com motivo", () => {
    const agendamento = Agendamento.agendar({
      pacienteId: 1,
      dataHora: new Date(2026, 8, 1, 15, 0),
    });

    agendamento.cancelar("Paciente solicitou desmarcação");
    expect(agendamento.getEstado().value).toBe("CANCELADO");
    expect(agendamento.getObservacoes()?.includes("Paciente solicitou desmarcação")).toBe(true);
  });

  await runTest("Deve reagendar consulta para novo horário", () => {
    const agendamento = Agendamento.agendar({
      pacienteId: 1,
      dataHora: new Date(2026, 8, 1, 10, 0),
    });

    const novoHorario = new Date(2026, 8, 2, 14, 0);
    agendamento.reagendar(novoHorario, 45);

    expect(agendamento.getDataHora().toISOString()).toBe(novoHorario.toISOString());
    expect(agendamento.getDuracaoMin()).toBe(45);
    expect(agendamento.getEstado().value).toBe("AGENDADO");
  });

  await runTest("Deve executar CriarAgendamentoUseCase e detetar conflito de horário do médico", async () => {
    const repo = new InMemoryAgendamentoRepository();
    const useCase = new CriarAgendamentoUseCase(repo);

    // Primeiro agendamento: 14:00 às 14:30
    const result1 = await useCase.execute({
      pacienteId: 10,
      medicoId: 5,
      dataHora: "2026-09-01T14:00:00.000Z",
      duracaoMin: 30,
    });
    expect(result1.isSuccess()).toBe(true);

    // Segundo agendamento conflitante para o mesmo médico: 14:15 às 14:45
    const result2 = await useCase.execute({
      pacienteId: 11,
      medicoId: 5,
      dataHora: "2026-09-01T14:15:00.000Z",
      duracaoMin: 30,
    });
    expect(result2.isFailure()).toBe(true);
    if (result2.isFailure()) {
      expect(result2.error instanceof BusinessException).toBe(true);
    }
  });

  await runTest("Deve executar ConfirmarAgendamentoUseCase e RegistarChegadaAgendamentoUseCase", async () => {
    const repo = new InMemoryAgendamentoRepository();
    const agendamento = Agendamento.agendar({
      id: "agendamento-1",
      pacienteId: 1,
      dataHora: new Date(2026, 8, 5, 9, 0),
    });
    await repo.save(agendamento);

    const useCaseConfirmar = new ConfirmarAgendamentoUseCase(repo);
    const resConf = await useCaseConfirmar.execute("agendamento-1");
    expect(resConf.isSuccess()).toBe(true);
    if (resConf.isSuccess()) {
      expect(resConf.value.estado).toBe("CONFIRMADO");
    }

    const useCaseChegada = new RegistarChegadaAgendamentoUseCase(repo);
    const resCheg = await useCaseChegada.execute("agendamento-1");
    expect(resCheg.isSuccess()).toBe(true);
    if (resCheg.isSuccess()) {
      expect(resCheg.value.estado).toBe("CHEGOU");
    }
  });

  console.log(`\nResultados Agendamento: ${testsPassed} passaram, ${testsFailed} falharam.`);
  if (testsFailed > 0) process.exit(1);
}

main().catch(console.error);
