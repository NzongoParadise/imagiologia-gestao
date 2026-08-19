import type { PrismaClient } from "@prisma/client";
import { Agendamento, IAgendamentoRepository, AgendamentoId } from "../../../domain/agendamento";
import { RepositoryException } from "../../../domain/shared/exceptions/RepositoryException";
import { AgendamentoMapper } from "../mappers/AgendamentoMapper";

export class AgendamentoPrismaRepository implements IAgendamentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async executar<T>(operacao: () => Promise<T>, contexto: string): Promise<T> {
    try {
      return await operacao();
    } catch (error) {
      throw new RepositoryException(
        `${contexto}: ${error instanceof Error ? error.message : "erro desconhecido"}`
      );
    }
  }

  private extrairId(id: AgendamentoId | number | string): number {
    if (typeof id === "number") return id;
    if (typeof id === "string") {
      const num = Number(id);
      if (!Number.isInteger(num)) throw new Error(`ID inválido: ${id}`);
      return num;
    }
    return id.toNumber();
  }

  async findById(id: AgendamentoId | number | string): Promise<Agendamento | null> {
    return this.executar(async () => {
      const numericId = this.extrairId(id);
      const item = await this.prisma.agendamentoConsulta.findUnique({
        where: { id: numericId },
      });
      return item ? AgendamentoMapper.toDomain(item) : null;
    }, "Não foi possível obter o agendamento por ID");
  }

  async findByPacienteId(pacienteId: number): Promise<Agendamento[]> {
    return this.executar(async () => {
      const itens = await this.prisma.agendamentoConsulta.findMany({
        where: { pacienteId },
        orderBy: { dataHora: "asc" },
      });
      return itens.map(AgendamentoMapper.toDomain);
    }, "Não foi possível listar agendamentos do paciente");
  }

  async findByMedicoId(medicoId: number, data?: Date): Promise<Agendamento[]> {
    return this.executar(async () => {
      const where: any = { medicoId };
      if (data) {
        const inicioDia = new Date(data);
        inicioDia.setHours(0, 0, 0, 0);
        const fimDia = new Date(data);
        fimDia.setHours(23, 59, 59, 999);
        where.dataHora = { gte: inicioDia, lte: fimDia };
      }

      const itens = await this.prisma.agendamentoConsulta.findMany({
        where,
        orderBy: { dataHora: "asc" },
      });
      return itens.map(AgendamentoMapper.toDomain);
    }, "Não foi possível listar agendamentos do médico");
  }

  async findByConsultorioId(consultorioId: number, data?: Date): Promise<Agendamento[]> {
    return this.executar(async () => {
      const where: any = { consultorioId };
      if (data) {
        const inicioDia = new Date(data);
        inicioDia.setHours(0, 0, 0, 0);
        const fimDia = new Date(data);
        fimDia.setHours(23, 59, 59, 999);
        where.dataHora = { gte: inicioDia, lte: fimDia };
      }

      const itens = await this.prisma.agendamentoConsulta.findMany({
        where,
        orderBy: { dataHora: "asc" },
      });
      return itens.map(AgendamentoMapper.toDomain);
    }, "Não foi possível listar agendamentos do consultório");
  }

  async findByEstado(estado: string): Promise<Agendamento[]> {
    return this.executar(async () => {
      const itens = await this.prisma.agendamentoConsulta.findMany({
        where: { estado },
        orderBy: { dataHora: "asc" },
      });
      return itens.map(AgendamentoMapper.toDomain);
    }, "Não foi possível listar agendamentos por estado");
  }

  async findByIntervalo(inicio: Date, fim: Date): Promise<Agendamento[]> {
    return this.executar(async () => {
      const itens = await this.prisma.agendamentoConsulta.findMany({
        where: {
          dataHora: {
            gte: inicio,
            lte: fim,
          },
        },
        orderBy: { dataHora: "asc" },
      });
      return itens.map(AgendamentoMapper.toDomain);
    }, "Não foi possível listar agendamentos no intervalo");
  }

  async findAll(filtros?: {
    pacienteId?: number;
    medicoId?: number;
    consultorioId?: number;
    especialidadeId?: number;
    estado?: string;
    limite?: number;
    offset?: number;
  }): Promise<Agendamento[]> {
    return this.executar(async () => {
      const where: any = {};
      if (filtros?.pacienteId) where.pacienteId = filtros.pacienteId;
      if (filtros?.medicoId) where.medicoId = filtros.medicoId;
      if (filtros?.consultorioId) where.consultorioId = filtros.consultorioId;
      if (filtros?.especialidadeId) where.especialidadeId = filtros.especialidadeId;
      if (filtros?.estado) where.estado = filtros.estado;

      const itens = await this.prisma.agendamentoConsulta.findMany({
        where,
        take: filtros?.limite ?? 50,
        skip: filtros?.offset ?? 0,
        orderBy: { dataHora: "asc" },
      });

      return itens.map(AgendamentoMapper.toDomain);
    }, "Não foi possível listar agendamentos");
  }

  async save(entity: Agendamento): Promise<Agendamento> {
    return this.executar(async () => {
      const dados = AgendamentoMapper.toPersistence(entity);
      const strId = entity.getId().value;
      const numericId = Number(strId);

      const isUpdate = Number.isInteger(numericId) && numericId > 0;

      const salvo = isUpdate
        ? await this.prisma.agendamentoConsulta.update({
            where: { id: numericId },
            data: dados,
          })
        : await this.prisma.agendamentoConsulta.create({
            data: dados,
          });

      return AgendamentoMapper.toDomain(salvo);
    }, "Não foi possível gravar o agendamento");
  }

  async delete(id: AgendamentoId | number | string): Promise<void> {
    await this.executar(async () => {
      const numericId = this.extrairId(id);
      await this.prisma.agendamentoConsulta.delete({ where: { id: numericId } });
    }, "Não foi possível eliminar o agendamento");
  }

  async exists(id: AgendamentoId | number | string): Promise<boolean> {
    return this.executar(async () => {
      const numericId = this.extrairId(id);
      const count = await this.prisma.agendamentoConsulta.count({ where: { id: numericId } });
      return count > 0;
    }, "Não foi possível verificar a existência do agendamento");
  }
}
