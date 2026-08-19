import type { PrismaClient } from "@prisma/client";
import { Laudo, ILaudoRepository, LaudoId } from "../../../domain/laudo";
import { RepositoryException } from "../../../domain/shared/exceptions/RepositoryException";
import { LaudoMapper } from "../mappers/LaudoMapper";

export class LaudoPrismaRepository implements ILaudoRepository {
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

  private extrairId(id: LaudoId | number | string): number {
    if (typeof id === "number") return id;
    if (typeof id === "string") {
      const num = Number(id);
      if (!Number.isInteger(num)) throw new Error(`ID inválido: ${id}`);
      return num;
    }
    return id.toNumber();
  }

  async findById(id: LaudoId | number | string): Promise<Laudo | null> {
    return this.executar(async () => {
      const numericId = this.extrairId(id);
      const item = await this.prisma.laudo.findUnique({
        where: { id: numericId },
      });
      return item ? LaudoMapper.toDomain(item) : null;
    }, "Não foi possível obter o laudo por ID");
  }

  async findByExameId(exameId: number): Promise<Laudo | null> {
    return this.executar(async () => {
      const item = await this.prisma.laudo.findUnique({
        where: { exameId },
      });
      return item ? LaudoMapper.toDomain(item) : null;
    }, "Não foi possível obter o laudo por exameId");
  }

  async findByMedicoId(medicoId: number): Promise<Laudo[]> {
    return this.executar(async () => {
      const itens = await this.prisma.laudo.findMany({
        where: { medicoAssinouId: medicoId },
        orderBy: { createdAt: "desc" },
      });
      return itens.map(LaudoMapper.toDomain);
    }, "Não foi possível listar laudos do médico");
  }

  async findAll(filtros?: {
    assinado?: boolean;
    limite?: number;
    offset?: number;
  }): Promise<Laudo[]> {
    return this.executar(async () => {
      const where: any = {};
      if (filtros?.assinado !== undefined) where.assinado = filtros.assinado;

      const itens = await this.prisma.laudo.findMany({
        where,
        take: filtros?.limite ?? 50,
        skip: filtros?.offset ?? 0,
        orderBy: { createdAt: "desc" },
      });

      return itens.map(LaudoMapper.toDomain);
    }, "Não foi possível listar laudos");
  }

  async save(entity: Laudo): Promise<Laudo> {
    return this.executar(async () => {
      const dados = LaudoMapper.toPersistence(entity);
      const strId = entity.getId().value;
      const numericId = Number(strId);

      const isUpdate = Number.isInteger(numericId) && numericId > 0;

      const salvo = isUpdate
        ? await this.prisma.laudo.update({
            where: { id: numericId },
            data: dados,
          })
        : await this.prisma.laudo.create({
            data: dados,
          });

      return LaudoMapper.toDomain(salvo);
    }, "Não foi possível gravar o laudo");
  }

  async delete(id: LaudoId | number | string): Promise<void> {
    await this.executar(async () => {
      const numericId = this.extrairId(id);
      await this.prisma.laudo.delete({ where: { id: numericId } });
    }, "Não foi possível eliminar o laudo");
  }

  async exists(id: LaudoId | number | string): Promise<boolean> {
    return this.executar(async () => {
      const numericId = this.extrairId(id);
      const count = await this.prisma.laudo.count({ where: { id: numericId } });
      return count > 0;
    }, "Não foi possível verificar a existência do laudo");
  }
}
