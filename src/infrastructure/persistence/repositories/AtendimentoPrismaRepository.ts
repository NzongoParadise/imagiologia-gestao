import type { Prisma, PrismaClient } from "@prisma/client";
import { Atendimento } from "../../../domain/atendimento/entities/Atendimento";
import type { EstadoType } from "../../../domain/atendimento/value-objects/EstadoAtendimento";
import { UniqueEntityID } from "../../../domain/shared/base/UniqueEntityID";
import { RepositoryException } from "../../../domain/shared/exceptions/RepositoryException";
import { AtendimentoMapper } from "../mappers/AtendimentoMapper";
import type { IAtendimentoRepository } from "./IAtendimentoRepository";

const ATIVOS = ["AGUARDANDO", "EM_TRIAGEM", "EM_ATENDIMENTO"] as const;
const paraId = (id: UniqueEntityID) => id.value;

export class AtendimentoPrismaRepository implements IAtendimentoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private async executar<T>(operacao: () => Promise<T>, contexto: string): Promise<T> {
    try {
      return await operacao();
    } catch (error) {
      throw new RepositoryException(`${contexto}: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    }
  }

  async findById(id: UniqueEntityID): Promise<Atendimento | null> {
    return this.executar(async () => {
      const item = await this.prisma.atendimento.findUnique({ where: { id: paraId(id) } });
      return item ? AtendimentoMapper.toDomain(item) : null;
    }, "Não foi possível obter o atendimento");
  }

  async findByCodigo(codigo: string): Promise<Atendimento | null> {
    return this.executar(async () => {
      const item = await this.prisma.atendimento.findUnique({ where: { codigo } });
      return item ? AtendimentoMapper.toDomain(item) : null;
    }, "Não foi possível obter o atendimento");
  }

  async findAll(): Promise<Atendimento[]> {
    return this.listar({});
  }

  async findByPacienteId(pacienteId: number): Promise<Atendimento[]> {
    return this.listar({ pacienteId });
  }

  async findByEstado(estado: EstadoType): Promise<Atendimento[]> {
    return this.listar({ estado: estado === "TRIAGEM" ? "EM_TRIAGEM" : estado });
  }

  async findAtivas(): Promise<Atendimento[]> {
    return this.listar({ estado: { in: ATIVOS } });
  }

  async findByEspecialidade(especialidadeId: number): Promise<Atendimento[]> {
    return this.listar({ especialidadeId });
  }

  async findByConsultorio(consultorioId: number): Promise<Atendimento[]> {
    return this.listar({ consultorioId });
  }

  async findByTipo(tipo: "CONSULTA" | "URGENCIA"): Promise<Atendimento[]> {
    return this.listar({ tipo });
  }

  async getProximo(especialidadeId?: number, consultorioId?: number): Promise<Atendimento | null> {
    return this.executar(async () => {
      const item = await this.prisma.atendimento.findFirst({
        where: { estado: { in: ["AGUARDANDO", "EM_TRIAGEM"] }, ...(especialidadeId ? { especialidadeId } : {}), ...(consultorioId ? { consultorioId } : {}) },
        orderBy: { criadoEm: "asc" },
      });
      return item ? AtendimentoMapper.toDomain(item) : null;
    }, "Não foi possível obter o próximo atendimento");
  }

  async getEstatisticas() {
    const contar = (estado?: string | string[]) => this.prisma.atendimento.count({ where: estado ? { estado: Array.isArray(estado) ? { in: estado } : estado } : {} });
    return this.executar(async () => {
      const [total, ativas, canceladas, concluidas, emTriagem, emAtendimento] = await Promise.all([
        contar(), contar([...ATIVOS]), contar("CANCELADO"), contar("CONCLUIDO"), contar("EM_TRIAGEM"), contar("EM_ATENDIMENTO"),
      ]);
      return { total, ativas, canceladas, concluidas, emTriagem, emAtendimento, emConclusao: 0 };
    }, "Não foi possível calcular as estatísticas");
  }

  async save(entity: Atendimento): Promise<Atendimento> {
    return this.executar(async () => {
      const dados = AtendimentoMapper.toPersistence(entity);
      const id = Number(entity.getId().value);
      const item = Number.isInteger(id) && id > 0
        ? await this.prisma.atendimento.update({ where: { id }, data: dados })
        : await this.prisma.atendimento.create({ data: dados });
      return AtendimentoMapper.toDomain(item);
    }, "Não foi possível guardar o atendimento");
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await this.executar(() => this.prisma.atendimento.delete({ where: { id: paraId(id) } }).then(() => undefined), "Não foi possível eliminar o atendimento");
  }

  async exists(id: UniqueEntityID): Promise<boolean> {
    return this.executar(async () => Boolean(await this.prisma.atendimento.findUnique({ where: { id: paraId(id) }, select: { id: true } })), "Não foi possível verificar o atendimento");
  }

  private async listar(where: Prisma.AtendimentoWhereInput): Promise<Atendimento[]> {
    return this.executar(async () => (await this.prisma.atendimento.findMany({ where, orderBy: { criadoEm: "desc" } })).map(AtendimentoMapper.toDomain), "Não foi possível listar atendimentos");
  }
}
