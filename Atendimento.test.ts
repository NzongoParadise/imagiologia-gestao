import { describe, it, expect } from "vitest";
import { Atendimento } from "../Atendimento";
import { EstadoAtendimento } from "../../value-objects/EstadoAtendimento";
import { BusinessException } from "@/domain/shared/exceptions/BusinessException";

describe("Atendimento", () => {
  describe("criar", () => {
    it("deve criar um atendimento novo com estado AGUARDANDO", () => {
      const atendimento = Atendimento.criar({
        codigo: "AT-2026-CON-0001",
        pacienteId: 1,
        especialidadeId: 1,
        prioridade: "Normal",
      });

      expect(atendimento.getCodigo()).toBe("AT-2026-CON-0001");
      expect(atendimento.getPacienteId()).toBe(1);
      expect(atendimento.getEstado().getValue()).toBe("AGUARDANDO");
      expect(atendimento.getPrioridade()).toBe("Normal");
    });

    it("deve publicar um evento de domínio 'AtendimentoCriado'", () => {
      const atendimento = Atendimento.criar({
        codigo: "AT-2026-CON-0001",
        pacienteId: 1,
        especialidadeId: 1,
      });

      const eventos = atendimento.getDomainEvents();
      expect(eventos).toHaveLength(1);
      expect(eventos[0].type).toBe("AtendimentoCriado");
      expect(eventos[0].aggregateId).toBe(atendimento.getId());
    });
  });

  describe("iniciarTriagem", () => {
    it("deve mudar o estado para EM_TRIAGEM quando está em AGUARDANDO", () => {
      const atendimento = Atendimento.criar({
        codigo: "AT-2026-CON-0001",
        pacienteId: 1,
        especialidadeId: 1,
      });

      atendimento.iniciarTriagem();

      expect(atendimento.getEstado().getValue()).toBe("EM_TRIAGEM");
    });

    it("deve lançar uma BusinessException se o estado não for AGUARDANDO", () => {
      const atendimento = Atendimento.criar({
        codigo: "AT-2026-CON-0001",
        pacienteId: 1,
        especialidadeId: 1,
      });

      atendimento.iniciarTriagem(); // Estado agora é EM_TRIAGEM

      // Tentar iniciar a triagem novamente deve falhar
      expect(() => atendimento.iniciarTriagem()).toThrow(BusinessException);
    });
  });

  describe("concluir", () => {
    it("deve mudar o estado para CONCLUIDO se estiver EM_ATENDIMENTO", () => {
      const atendimento = Atendimento.criar({
        codigo: "AT-2026-CON-0001",
        pacienteId: 1,
        especialidadeId: 1,
      });

      atendimento.iniciarTriagem();
      atendimento.iniciarAtendimento();
      atendimento.concluir();

      expect(atendimento.getEstado().getValue()).toBe("CONCLUIDO");
    });

    it("deve lançar uma BusinessException se tentar concluir um atendimento em AGUARDANDO", () => {
      const atendimento = Atendimento.criar({
        codigo: "AT-2026-CON-0001",
        pacienteId: 1,
        especialidadeId: 1,
      });

      expect(() => atendimento.concluir()).toThrow(BusinessException);
    });
  });

  describe("cancelar", () => {
    it("deve mudar o estado para CANCELADO", () => {
      const atendimento = Atendimento.criar({
        codigo: "AT-2026-CON-0001",
        pacienteId: 1,
        especialidadeId: 1,
      });

      atendimento.cancelar("Solicitação do paciente");

      expect(atendimento.getEstado().getValue()).toBe("CANCELADO");
    });

    it("deve lançar uma BusinessException se tentar cancelar um atendimento CONCLUIDO", () => {
      const atendimento = Atendimento.criar({
        codigo: "AT-2026-CON-0001",
        pacienteId: 1,
        especialidadeId: 1,
      });

      atendimento.iniciarTriagem();
      atendimento.iniciarAtendimento();
      atendimento.concluir();

      expect(() => atendimento.cancelar("Qualquer motivo")).toThrow(
        BusinessException
      );
    });
  });
});