"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { registarHistorico } from "./historico-actions";
import { autorizar } from "@/lib/permissions-server";

export async function uploadImagem(exameId: number, formData: FormData) {
  await autorizar("imagens", "criar");
  const file = formData.get("file") as File;
  if (!file) throw new Error("Nenhum ficheiro enviado");

  const filename = `${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const imagem = await prisma.imagem.create({
    data: {
      exameId,
      filename,
      originalName: file.name,
      mimeType: file.type,
      tamanho: file.size,
      path: `/uploads/exame-${exameId}/${filename}`,
      dados: buffer,
    },
  });

  await registarHistorico({
    acao: "UPLOAD",
    entidade: "IMAGEM",
    entidadeId: imagem.id,
    descricao: `Imagem ${file.name} adicionada ao exame #${exameId}`,
    exameId,
  });

  revalidatePath(`/exames/${exameId}`);
  return imagem;
}

export async function removerImagem(id: number) {
  await autorizar("imagens", "eliminar");
  const imagem = await prisma.imagem.findUnique({ where: { id } });
  if (!imagem) throw new Error("Imagem não encontrada");

  await prisma.imagem.delete({ where: { id } });

  await registarHistorico({
    acao: "REMOCAO",
    entidade: "IMAGEM",
    entidadeId: id,
    descricao: `Imagem ${imagem.originalName} removida`,
    exameId: imagem.exameId,
  });

  revalidatePath(`/exames/${imagem.exameId}`);
}

export async function listarImagens(exameId: number) {
  return prisma.imagem.findMany({
    where: { exameId },
    orderBy: { createdAt: "desc" },
  });
}

