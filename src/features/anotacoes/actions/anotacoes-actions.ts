"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { autorizar } from "@/lib/permissions-server";

export async function criarAnotacao(data: {
  conteudo: string;
  tipo?: string;
  entidade?: string;
  entidadeId?: number | null;
  exameId?: number | null;
  pacienteId?: number | null;
}) {
  await autorizar("exames", "criar");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");

  const anotacao = await prisma.anotacao.create({

    data: {
      conteudo: data.conteudo,
      tipo: data.tipo || "geral",
      entidade: data.entidade || null,
      entidadeId: data.entidadeId ?? null,
      exameId: data.exameId ?? null,
      pacienteId: data.pacienteId ?? null,
      utilizadorId: Number(session.user.id),
    },
    include: {
      utilizador: { select: { id: true, nome: true } },
    },
  });

  if (data.exameId) {
    revalidatePath(`/exames/${data.exameId}`);
  }
  if (data.pacienteId) {
    revalidatePath(`/pacientes/${data.pacienteId}`);
  }

  return anotacao;
}

export async function listarAnotacoes(params: {
  exameId?: number;
  pacienteId?: number;
  entidade?: string;
  entidadeId?: number;
  utilizadorId?: number;
  tipo?: string;
  limit?: number;
}) {
  const where: Record<string, unknown> = {};

  if (params.exameId) where.exameId = params.exameId;
  if (params.pacienteId) where.pacienteId = params.pacienteId;
  if (params.entidade) {
    where.entidade = params.entidade;
    if (params.entidadeId) where.entidadeId = params.entidadeId;
  }
  if (params.utilizadorId) where.utilizadorId = params.utilizadorId;
  if (params.tipo) where.tipo = params.tipo;

  return prisma.anotacao.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit || 50,
    include: {
      utilizador: { select: { id: true, nome: true } },
    },
  });
}

export async function removerAnotacao(id: number) {
  await autorizar("exames", "editar");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");

  const anotacao = await prisma.anotacao.findUnique({ where: { id } });
  if (!anotacao) throw new Error("Anotacao nao encontrada");

  if (anotacao.utilizadorId !== Number(session.user.id)) {
    throw new Error("So pode remover as suas proprias anotacoes");
  }


  await prisma.anotacao.delete({ where: { id } });

  if (anotacao.exameId) {
    revalidatePath(`/exames/${anotacao.exameId}`);
  }
  if (anotacao.pacienteId) {
    revalidatePath(`/pacientes/${anotacao.pacienteId}`);
  }
}

export async function atualizarAnotacao(id: number, conteudo: string) {
  await autorizar("exames", "editar");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");

  const anotacao = await prisma.anotacao.findUnique({ where: { id } });
  if (!anotacao) throw new Error("Anotacao nao encontrada");

  if (anotacao.utilizadorId !== Number(session.user.id)) {
    throw new Error("So pode editar as suas proprias anotacoes");
  }


  const updated = await prisma.anotacao.update({
    where: { id },
    data: { conteudo },
    include: {
      utilizador: { select: { id: true, nome: true } },
    },
  });

  if (updated.exameId) {
    revalidatePath(`/exames/${updated.exameId}`);
  }
  if (updated.pacienteId) {
    revalidatePath(`/pacientes/${updated.pacienteId}`);
  }

  return updated;
}

