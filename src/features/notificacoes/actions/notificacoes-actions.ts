"use server";

import { prisma } from "@/lib/db";

interface CriarNotificacaoParams {
  titulo: string;
  mensagem: string;
  tipo?: string;
  utilizadorId?: number;
  exameId?: number;
  pacienteId?: number;
}

export async function criarNotificacao(params: CriarNotificacaoParams) {
  try {
    await prisma.notificacao.create({
      data: {
        titulo: params.titulo,
        mensagem: params.mensagem,
        tipo: params.tipo || "info",
        utilizadorId: params.utilizadorId || null,
        exameId: params.exameId || null,
        pacienteId: params.pacienteId || null,
      },
    });
  } catch (error) {
    console.error("Erro ao criar notificação:", error);
  }
}

export async function listarNotificacoes(limit = 20) {
  try {
    const data = await prisma.notificacao.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        exame: { select: { id: true } },
        paciente: { select: { id: true, nome: true } },
      },
    });

    return data.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Erro ao listar notificações:", error);
    return [];
  }
}

export async function obterNotificacoesNaoLidas() {
  try {
    const data = await prisma.notificacao.findMany({
      where: { lida: false },
      orderBy: { createdAt: "desc" },
      include: {
        exame: { select: { id: true } },
        paciente: { select: { id: true, nome: true } },
      },
    });

    return data.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Erro ao obter notificações não lidas:", error);
    return [];
  }
}

export async function contarNotificacoesNaoLidas() {
  try {
    return await prisma.notificacao.count({
      where: { lida: false },
    });
  } catch (error) {
    console.error("Erro ao contar notificações:", error);
    return 0;
  }
}

export async function marcarNotificacaoComoLida(id: number) {
  try {
    await prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });
  } catch (error) {
    console.error("Erro ao marcar notificação como lida:", error);
  }
}

export async function marcarTodasComoLidas() {
  try {
    await prisma.notificacao.updateMany({
      where: { lida: false },
      data: { lida: true },
    });
  } catch (error) {
    console.error("Erro ao marcar todas como lidas:", error);
  }
}

