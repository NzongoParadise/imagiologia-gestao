import { Laudo, LaudoId, ConteudoLaudo, AssinaturaDigital } from "../domain/laudo";
import { CriarLaudoUseCase, AssinarLaudoUseCase } from "../application/laudo";
import { ILaudoRepository } from "../domain/laudo";
import { ValidationException, BusinessException } from "../domain/shared/exceptions/DomainException";

let testsPassed = 0;
let testsFailed = 0;

async function runTest(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`✅ [Laudo] ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ [Laudo] ${name}:`, (error as Error).message);
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

// In-Memory Repository for Laudo
class InMemoryLaudoRepository implements ILaudoRepository {
  private items: Map<string, Laudo> = new Map();

  async findById(id: LaudoId | number | string): Promise<Laudo | null> {
    const key = typeof id === "object" ? id.value : String(id);
    return this.items.get(key) ?? null;
  }

  async findByExameId(exameId: number): Promise<Laudo | null> {
    for (const l of this.items.values()) {
      if (l.getExameId() === exameId) return l;
    }
    return null;
  }

  async findByMedicoId(medicoId: number): Promise<Laudo[]> {
    return Array.from(this.items.values()).filter((l) => l.getMedicoAssinouId() === medicoId);
  }

  async findAll(filtros?: { assinado?: boolean }): Promise<Laudo[]> {
    let list = Array.from(this.items.values());
    if (filtros?.assinado !== undefined) {
      list = list.filter((l) => l.isAssinado() === filtros.assinado);
    }
    return list;
  }

  async save(laudo: Laudo): Promise<Laudo> {
    this.items.set(laudo.getId().value, laudo);
    return laudo;
  }

  async delete(id: LaudoId | number | string): Promise<void> {
    const key = typeof id === "object" ? id.value : String(id);
    this.items.delete(key);
  }

  async exists(id: LaudoId | number | string): Promise<boolean> {
    const key = typeof id === "object" ? id.value : String(id);
    return this.items.has(key);
  }
}

async function main() {
  console.log("=== INICIANDO TESTES DO AGREGADO LAUDO ===");

  await runTest("Deve criar Value Objects de Laudo corretamente", () => {
    const conteudo = ConteudoLaudo.create({
      tecnica: "Radiografia simples do tórax em PA.",
      achados: "Campos pulmonares transparentes, sem condensações focais.",
      conclusao: "Radiografia de tórax dentro dos padrões normais.",
    });

    expect(conteudo.tecnica?.includes("Radiografia simples")).toBe(true);
    expect(conteudo.conclusao?.includes("padrões normais")).toBe(true);
    expect(conteudo.texto.includes("TÉCNICA:")).toBe(true);
  });

  await runTest("Deve criar rascunho de Laudo e emitir evento LaudoCriado", () => {
    const laudo = Laudo.criarRascunho({
      exameId: 42,
      conteudo: "Exame sem alterações significativas detectadas.",
    });

    expect(laudo.getExameId()).toBe(42);
    expect(laudo.isAssinado()).toBe(false);
    expect(laudo.hasDomainEvents()).toBe(true);
    const eventos = laudo.getDomainEvents();
    expect(eventos[0].type).toBe("LaudoCriado");
  });

  await runTest("Deve permitir atualizar conteúdo de laudo em rascunho", () => {
    const laudo = Laudo.criarRascunho({
      exameId: 1,
      conteudo: "Versão preliminar de teste.",
    });
    laudo.clearDomainEvents();

    laudo.atualizarConteudo("Versão corrigida e revisada pelo radiologista.");
    expect(laudo.getConteudo().texto).toBe("Versão corrigida e revisada pelo radiologista.");
    expect(laudo.getDomainEvents().length).toBe(1);
    expect(laudo.getDomainEvents()[0].type).toBe("LaudoConteudoAtualizado");
  });

  await runTest("Deve assinar laudo digitalmente e emitir evento LaudoAssinado", () => {
    const laudo = Laudo.criarRascunho({
      exameId: 10,
      conteudo: "Laudo completo pronto para assinatura.",
    });
    laudo.clearDomainEvents();

    laudo.assinar(7, "Dr. António Radiologista");

    expect(laudo.isAssinado()).toBe(true);
    expect(laudo.getMedicoAssinouId()).toBe(7);
    expect(laudo.getAssinatura()?.hash.startsWith("ASSINADO-DOC-7")).toBe(true);
    expect(laudo.getDomainEvents().length).toBe(1);
    expect(laudo.getDomainEvents()[0].type).toBe("LaudoAssinado");
  });

  await runTest("Deve impedir alteração de conteúdo de laudo assinado (regra de imutabilidade)", () => {
    const laudo = Laudo.criarRascunho({
      exameId: 10,
      conteudo: "Laudo oficial assinado.",
    });
    laudo.assinar(7);

    expect(() =>
      laudo.atualizarConteudo("Tentativa de modificação indevida.")
    ).toThrow(BusinessException);
  });

  await runTest("Deve permitir reabrir laudo assinado para retificação com justificativa", () => {
    const laudo = Laudo.criarRascunho({
      exameId: 10,
      conteudo: "Laudo original com pequeno lapso.",
    });
    laudo.assinar(7);
    laudo.clearDomainEvents();

    laudo.reabrirParaRetificacao(7, "Retificação de achado no lobo superior direito a pedido do clínico.");

    expect(laudo.isAssinado()).toBe(false);
    expect(laudo.getAssinatura()).toBe(undefined);
    expect(laudo.getDomainEvents().length).toBe(1);
    expect(laudo.getDomainEvents()[0].type).toBe("LaudoRetificado");

    // Agora deve permitir atualizar o texto
    laudo.atualizarConteudo("Laudo retificado com achados corrigidos.");
    expect(laudo.getConteudo().texto).toBe("Laudo retificado com achados corrigidos.");
  });

  await runTest("Deve executar CriarLaudoUseCase com sucesso", async () => {
    const repo = new InMemoryLaudoRepository();
    const useCase = new CriarLaudoUseCase(repo);

    const result = await useCase.execute({
      exameId: 50,
      conteudo: "Relatório de ecografia abdominal normal.",
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.exameId).toBe(50);
      expect(result.value.assinado).toBe(false);
    }
  });

  await runTest("Deve executar AssinarLaudoUseCase com sucesso", async () => {
    const repo = new InMemoryLaudoRepository();
    const laudo = Laudo.criarRascunho({ id: "laudo-1", exameId: 12, conteudo: "Texto do laudo." });
    await repo.save(laudo);

    const useCase = new AssinarLaudoUseCase(repo);
    const result = await useCase.execute({
      id: "laudo-1",
      medicoId: 8,
      certificadoOuNome: "Dra. Inês Radiologia",
    });

    expect(result.isSuccess()).toBe(true);
    if (result.isSuccess()) {
      expect(result.value.assinado).toBe(true);
      expect(result.value.medicoAssinouId).toBe(8);
      expect(Boolean(result.value.assinaturaHash)).toBe(true);
    }
  });

  console.log(`\nResultados Laudo: ${testsPassed} passaram, ${testsFailed} falharam.`);
  if (testsFailed > 0) process.exit(1);
}

main().catch(console.error);
