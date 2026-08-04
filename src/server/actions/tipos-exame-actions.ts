"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { tipoExameSchema, type TipoExameInput } from "@/validators/schemas";
import { registarHistorico } from "./historico-actions";
import { autorizar } from "@/lib/permissions-server";

export async function listarTiposExame() {
  return prisma.tipoExame.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { exames: true } } },
  });
}

export async function obterTipoExame(id: number) {
  return prisma.tipoExame.findUnique({ where: { id } });
}

export async function criarTipoExame(data: TipoExameInput) {
  await autorizar("tipos-exame", "criar");
  const validated = tipoExameSchema.parse(data);
  const tipoExame = await prisma.tipoExame.create({ data: validated });

  await registarHistorico({
    acao: "CRIACAO",
    entidade: "TIPO_EXAME",
    entidadeId: tipoExame.id,
    descricao: `Tipo de Exame ${tipoExame.nome} criado`,
  });

  revalidatePath("/tipos-exame");
  return tipoExame;
}

export async function atualizarTipoExame(id: number, data: TipoExameInput) {
  await autorizar("tipos-exame", "editar");
  const validated = tipoExameSchema.parse(data);
  const tipoExame = await prisma.tipoExame.update({ where: { id }, data: validated });

  await registarHistorico({
    acao: "ATUALIZACAO",
    entidade: "TIPO_EXAME",
    entidadeId: id,
    descricao: `Tipo de Exame ${tipoExame.nome} atualizado`,
  });

  revalidatePath("/tipos-exame");
  return tipoExame;
}

export async function eliminarTipoExame(id: number) {
  await autorizar("tipos-exame", "eliminar");
  const tipoExame = await prisma.tipoExame.findUnique({ where: { id } });
  if (!tipoExame) throw new Error("Tipo de Exame não encontrado");

  await prisma.tipoExame.delete({ where: { id } });

  await registarHistorico({
    acao: "ELIMINACAO",
    entidade: "TIPO_EXAME",
    entidadeId: id,
    descricao: `Tipo de Exame ${tipoExame.nome} eliminado`,
  });

  revalidatePath("/tipos-exame");
}

