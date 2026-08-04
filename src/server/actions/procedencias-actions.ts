"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { procedenciaSchema, type ProcedenciaInput } from "@/validators/schemas";
import { registarHistorico } from "./historico-actions";
import { autorizar } from "@/lib/permissions-server";

export async function listarProcedencias() {
  return prisma.procedencia.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { exames: true } } },
  });
}

export async function obterProcedencia(id: number) {
  return prisma.procedencia.findUnique({ where: { id } });
}

export async function criarProcedencia(data: ProcedenciaInput) {
  await autorizar("procedencias", "criar");
  const validated = procedenciaSchema.parse(data);
  const procedencia = await prisma.procedencia.create({ data: validated });

  await registarHistorico({
    acao: "CRIACAO",
    entidade: "PROCEDENCIA",
    entidadeId: procedencia.id,
    descricao: `Procedência ${procedencia.nome} criada`,
  });

  revalidatePath("/procedencias");
  return procedencia;
}

export async function atualizarProcedencia(id: number, data: ProcedenciaInput) {
  await autorizar("procedencias", "editar");
  const validated = procedenciaSchema.parse(data);
  const procedencia = await prisma.procedencia.update({ where: { id }, data: validated });

  await registarHistorico({
    acao: "ATUALIZACAO",
    entidade: "PROCEDENCIA",
    entidadeId: id,
    descricao: `Procedência ${procedencia.nome} atualizada`,
  });

  revalidatePath("/procedencias");
  return procedencia;
}

export async function eliminarProcedencia(id: number) {
  await autorizar("procedencias", "eliminar");
  const procedencia = await prisma.procedencia.findUnique({ where: { id } });
  if (!procedencia) throw new Error("Procedência não encontrada");

  await prisma.procedencia.delete({ where: { id } });

  await registarHistorico({
    acao: "ELIMINACAO",
    entidade: "PROCEDENCIA",
    entidadeId: id,
    descricao: `Procedência ${procedencia.nome} eliminada`,
  });

  revalidatePath("/procedencias");
}

