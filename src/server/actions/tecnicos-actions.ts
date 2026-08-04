"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { tecnicoSchema, type TecnicoInput } from "@/validators/schemas";
import { registarHistorico } from "./historico-actions";
import { autorizar } from "@/lib/permissions-server";

export async function listarTecnicos() {
  return prisma.tecnico.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { exames: true } } },
  });
}

export async function obterTecnico(id: number) {
  return prisma.tecnico.findUnique({
    where: { id },
    include: { _count: { select: { exames: true } } },
  });
}

export async function criarTecnico(data: TecnicoInput) {
  await autorizar("tecnicos", "criar");
  const validated = tecnicoSchema.parse(data);
  const tecnico = await prisma.tecnico.create({ data: validated });

  await registarHistorico({
    acao: "CRIACAO",
    entidade: "TECNICO",
    entidadeId: tecnico.id,
    descricao: `Técnico ${tecnico.nome} criado`,
  });

  revalidatePath("/tecnicos");
  return tecnico;
}

export async function atualizarTecnico(id: number, data: TecnicoInput) {
  await autorizar("tecnicos", "editar");
  const validated = tecnicoSchema.parse(data);
  const tecnico = await prisma.tecnico.update({ where: { id }, data: validated });

  await registarHistorico({
    acao: "ATUALIZACAO",
    entidade: "TECNICO",
    entidadeId: id,
    descricao: `Técnico ${tecnico.nome} atualizado`,
  });

  revalidatePath("/tecnicos");
  return tecnico;
}

export async function eliminarTecnico(id: number) {
  await autorizar("tecnicos", "eliminar");
  const tecnico = await prisma.tecnico.findUnique({ where: { id } });
  if (!tecnico) throw new Error("Técnico não encontrado");

  await prisma.tecnico.delete({ where: { id } });

  await registarHistorico({
    acao: "ELIMINACAO",
    entidade: "TECNICO",
    entidadeId: id,
    descricao: `Técnico ${tecnico.nome} eliminado`,
  });

  revalidatePath("/tecnicos");
}

