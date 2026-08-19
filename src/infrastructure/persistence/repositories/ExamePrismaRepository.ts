import type { PrismaClient } from "@prisma/client";
import { Exame, IExameRepository, ExameId } from "../../../domain/exame";
import { RepositoryException } from "../../../domain/shared/exceptions/RepositoryException";
import { ExameMapper } from "../mappers/ExameMapper";

export class ExamePrismaRepository implements IExameRepository {
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

  private extrairId(id: ExameId | number | string): number {
    if (typeof id === "number") return id;
    if (typeof id === "string") {
      const num = Number(id);
      if (!Number.isInteger(num)) throw new Error(`ID inválido: ${id}`);
      return num;
    }
    return id.toNumber();
  }

  async findById(id: ExameId | number | string): Promise<Exame | null> {
    return this.executar(async () => {
      const numericId = this.extrairId(id);
      const item = await this.prisma.exame.findUnique({
        where: { id: numericId },
      });
      return item ? ExameMapper.toDomain(item) : null;
    }, "Não foi possível obter o exame por ID");
  }

  async findByCodigo(codigo: string): Promise<Exame | null> {
    return this.executar(async () => {
      const item = await this.prisma.exame.findUnique({
        where: { codigo: codigo.trim() },
      });
      return item ? ExameMapper.toDomain(item) : null;
    }, "Não foi possível obter o exame por código");
  }

  async findByPacienteId(pacienteId: number): Promise<Exame[]> {
    return this.executar(async () => {
      const itens = await this.prisma.exame.findMany({
        where: { pacienteId },
        orderBy: { dataExame: "desc" },
      });
      return itens.map(ExameMapper.toDomain);
    }, "Não foi possível listar exames do paciente");
  }

  async findByEstado(estado: string): Promise<Exame[]> {
    return this.executar(async () => {
      const itens = await this.prisma.exame.findMany({
        where: { estado: { equals: estado, mode: "insensitive" } },
        orderBy: { dataExame: "desc" },
      });
      return itens.map(ExameMapper.toDomain);
    }, "Não foi possível listar exames por estado");
  }

  async findByTecnicoId(tecnicoId: number): Promise<Exame[]> {
    return this.executar(async () => {
      const itens = await this.prisma.exame.findMany({
        where: { tecnicoId },
        orderBy: { dataExame: "desc" },
      });
      return itens.map(ExameMapper.toDomain);
    }, "Não foi possível listar exames do técnico");
  }

  async findAll(filtros?: {
    pacienteId?: number;
    estado?: string;
    limite?: number;
    offset?: number;
  }): Promise<Exame[]> {
    return this.executar(async () => {
      const where: any = {};
      if (filtros?.pacienteId) where.pacienteId = filtros.pacienteId;
      if (filtros?.estado) where.estado = { equals: filtros.estado, mode: "insensitive" };

      const itens = await this.prisma.exame.findMany({
        where,
        take: filtros?.limite ?? 50,
        skip: filtros?.offset ?? 0,
        orderBy: { dataExame: "desc" },
      });

      return itens.map(ExameMapper.toDomain);
    }, "Não foi possível listar exames");
  }

  async save(entity: Exame): Promise<Exame> {
    return this.executar(async () => {
      const dados = ExameMapper.toPersistence(entity);
      const strId = entity.getId().value;
      const numericId = Number(strId);

      const isUpdate = Number.isInteger(numericId) && numericId > 0;

      const salvo = isUpdate
        ? await this.prisma.exame.update({
            where: { id: numericId },
            data: dados,
          })
        : await this.prisma.exame.create({
            data: dados,
          });

      return ExameMapper.toDomain(salvo);
    }, "Não foi possível gravar o exame");
  }

  async delete(id: ExameId | number | string): Promise<void> {
    await this.executar(async () => {
      const numericId = this.extrairId(id);
      await this.prisma.exame.delete({ where: { id: numericId } });
    }, "Não foi possível eliminar o exame");
  }

  async exists(id: ExameId | number | string): Promise<boolean> {
    return this.executar(async () => {
      const numericId = this.extrairId(id);
      const count = await this.prisma.exame.count({ where: { id: numericId } });
      return count > 0;
    }, "Não foi possível verificar a existência do exame");
  }

  async count(filtros?: { estado?: string; pacienteId?: number }): Promise<number> {
    return this.executar(async () => {
      const where: any = {};
      if (filtros?.pacienteId) where.pacienteId = filtros.pacienteId;
      if (filtros?.estado) where.estado = { equals: filtros.estado, mode: "insensitive" };
      return await this.prisma.exame.count({ where });
    }, "Não foi possível contar exames");
  }
}
