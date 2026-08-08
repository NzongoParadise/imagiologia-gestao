"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { registarHistorico } from "./historico-actions";
import { autorizar } from "@/lib/permissions-server";
import { diagnosticarImagemServer } from "@/features/imagens/services/ml-service";
import { gerarDiagnosticoComGemini } from "@/services/ai.service";
import type { MLDiagnostico } from "@/features/imagens/types";

/**
 * Diagnostica uma imagem com o motor de visão (TorchXRayVision/heurística)
 * e enriquece o resultado (diagnóstico, resumo e descrições dos achados)
 * com o Google Gemini quando a chave GEMINI_API_KEY está configurada.
 *
 * É a via server-safe para o módulo de Imagens usar o Gemini, uma vez que o
 * Gemini só corre no servidor (Node.js). Devolve um MLDiagnostico enriquecido.
 */
export async function diagnosticarImagemComGemini(
  imagemId: number,
  nomeTipoExame?: string
): Promise<MLDiagnostico> {
  await autorizar("imagens", "ler");

  const imagem = await prisma.imagem.findUnique({ where: { id: imagemId } });
  if (!imagem) throw new Error("Imagem não encontrada");

  // 1. Motor de visão (server-safe) com os bytes da imagem.
  const resultado = await diagnosticarImagemServer(
    imagemId,
    imagem.dados ?? Buffer.from([]),
    nomeTipoExame
  );

  // 2. Enriquecer com Gemini (com fallback para os valores originais).
  const enriquecido = await gerarDiagnosticoComGemini({
    diagnostico: resultado.diagnosticoPrincipal || "Sem alterações significativas",
    confianca: resultado.confiancaDiagnostico ?? 0,
    achados: (resultado.achados || []).map((a) => ({
      nome: a.tipo,
      probabilidade: a.confianca ?? 0,
      presente: (a.confianca ?? 0) > 50,
      descricao: a.descricao,
    })),
    resumo: resultado.resumo || "",
    modalidade: resultado.modalidade || nomeTipoExame,
  });

  if (enriquecido) {
    return {
      ...resultado,
      diagnosticoPrincipal: enriquecido.diagnostico,
      resumo: enriquecido.resumo,
      achados: (resultado.achados || []).map((a) => {
        const enr = enriquecido.achados.find((e) => e.nome.toLowerCase() === a.tipo.toLowerCase());
        return enr?.descricao ? { ...a, descricao: enr.descricao } : a;
      }),
      modelo: "Gemini + Motor de Visão",
    };
  }

  return resultado;
}

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

