"use server";

import { prisma } from "@/lib/db";

interface RegistarHistoricoParams {
  acao: string;
  entidade: string;
  entidadeId?: number;
  descricao?: string;
  utilizadorId?: number;
  pacienteId?: number;
  exameId?: number;
}

export async function registarHistorico(params: RegistarHistoricoParams) {
  try {
    await prisma.historico.create({
      data: {
        acao: params.acao,
        entidade: params.entidade,
        entidadeId: params.entidadeId || null,
        descricao: params.descricao || null,
        utilizadorId: params.utilizadorId || null,
        pacienteId: params.pacienteId || null,
        exameId: params.exameId || null,
      },
    });
  } catch (error) {
    console.error("Erro ao registrar histórico:", error);
  }
}

export async function listarHistorico(page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [data, total] = await Promise.all([
    prisma.historico.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        utilizador: { select: { id: true, nome: true, email: true } },
        paciente: { select: { id: true, nome: true } },
        exame: { select: { id: true } },
      },
    }),
    prisma.historico.count(),
  ]);
  return { data, total, pages: Math.ceil(total / limit) };
}

export async function listarHistoricoPorEntidade(entidade: string, entidadeId: number) {
  return prisma.historico.findMany({
    where: { entidade, entidadeId },
    orderBy: { createdAt: "desc" },
    include: {
      utilizador: { select: { id: true, nome: true } },
    },
  });
}

