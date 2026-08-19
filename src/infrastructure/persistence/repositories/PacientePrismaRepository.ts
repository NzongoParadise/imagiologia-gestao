import type { PrismaClient } from "@prisma/client";
import { Paciente, IPacienteRepository, PacienteId } from "../../../domain/paciente";
import { RepositoryException } from "../../../domain/shared/exceptions/RepositoryException";
import { PacienteMapper } from "../mappers/PacienteMapper";

export class PacientePrismaRepository implements IPacienteRepository {
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

  private extrairId(id: PacienteId | number | string): number {
    if (typeof id === "number") return id;
    if (typeof id === "string") {
      const num = Number(id);
      if (!Number.isInteger(num)) throw new Error(`ID inválido: ${id}`);
      return num;
    }
    return id.toNumber();
  }

  async findById(id: PacienteId | number | string): Promise<Paciente | null> {
    return this.executar(async () => {
      const numericId = this.extrairId(id);
      const item = await this.prisma.paciente.findUnique({
        where: { id: numericId },
      });
      return item ? PacienteMapper.toDomain(item) : null;
    }, "Não foi possível obter o paciente por ID");
  }

  async findByNumeroProcesso(numeroProcesso: string): Promise<Paciente | null> {
    return this.executar(async () => {
      const item = await this.prisma.paciente.findUnique({
        where: { numeroProcesso: numeroProcesso.trim() },
      });
      return item ? PacienteMapper.toDomain(item) : null;
    }, "Não foi possível obter o paciente por número de processo");
  }

  async findByDocumento(documento: string): Promise<Paciente | null> {
    return this.executar(async () => {
      const termo = documento.trim();
      const item = await this.prisma.paciente.findFirst({
        where: {
          OR: [
            { bi: termo },
            { nif: termo },
            { documento: termo },
          ],
        },
      });
      return item ? PacienteMapper.toDomain(item) : null;
    }, "Não foi possível obter o paciente por documento");
  }

  async findAll(filtros?: {
    termo?: string;
    limite?: number;
    offset?: number;
  }): Promise<Paciente[]> {
    return this.executar(async () => {
      const termo = filtros?.termo?.trim();
      const where = termo
        ? {
            OR: [
              { nome: { contains: termo, mode: "insensitive" as const } },
              { numeroProcesso: { contains: termo, mode: "insensitive" as const } },
              { telefone: { contains: termo } },
              { email: { contains: termo, mode: "insensitive" as const } },
              { bi: { contains: termo, mode: "insensitive" as const } },
              { nif: { contains: termo, mode: "insensitive" as const } },
            ],
          }
        : {};

      const itens = await this.prisma.paciente.findMany({
        where,
        take: filtros?.limite ?? 50,
        skip: filtros?.offset ?? 0,
        orderBy: { nome: "asc" },
      });

      return itens.map(PacienteMapper.toDomain);
    }, "Não foi possível listar pacientes");
  }

  async save(entity: Paciente): Promise<Paciente> {
    return this.executar(async () => {
      const dados = PacienteMapper.toPersistence(entity);
      const strId = entity.getId().value;
      const numericId = Number(strId);

      const isUpdate = Number.isInteger(numericId) && numericId > 0;

      const salvo = isUpdate
        ? await this.prisma.paciente.update({
            where: { id: numericId },
            data: dados,
          })
        : await this.prisma.paciente.create({
            data: dados,
          });

      return PacienteMapper.toDomain(salvo);
    }, "Não foi possível gravar o paciente");
  }

  async delete(id: PacienteId | number | string): Promise<void> {
    await this.executar(async () => {
      const numericId = this.extrairId(id);
      await this.prisma.paciente.delete({ where: { id: numericId } });
    }, "Não foi possível eliminar o paciente");
  }

  async exists(id: PacienteId | number | string): Promise<boolean> {
    return this.executar(async () => {
      const numericId = this.extrairId(id);
      const count = await this.prisma.paciente.count({ where: { id: numericId } });
      return count > 0;
    }, "Não foi possível verificar a existência do paciente");
  }

  async count(termo?: string): Promise<number> {
    return this.executar(async () => {
      const termoLimpo = termo?.trim();
      const where = termoLimpo
        ? {
            OR: [
              { nome: { contains: termoLimpo, mode: "insensitive" as const } },
              { numeroProcesso: { contains: termoLimpo, mode: "insensitive" as const } },
            ],
          }
        : {};
      return await this.prisma.paciente.count({ where });
    }, "Não foi possível contar pacientes");
  }
}
