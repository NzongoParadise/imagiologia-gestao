"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { autorizar } from "@/lib/permissions-server";

function serializarMensagem(m: {
  id: number;
  conversaId: number;
  utilizadorId: number;
  conteudo: string;
  createdAt: Date;
  utilizador: { id: number; nome: string; role: string } | null;
}) {
  return {
    id: m.id,
    conversaId: m.conversaId,
    utilizadorId: m.utilizadorId,
    conteudo: m.conteudo,
    createdAt: m.createdAt.toISOString(),
    utilizador: m.utilizador,
  };
}

/** Lista as conversas do utilizador autenticado (com última mensagem e nº de não lidas). */
export async function listarConversas() {
  await autorizar("chat");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const conversas = await prisma.conversa.findMany({
    where: {
      participantes: { some: { utilizadorId: userId } },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      participantes: {
        include: {
          utilizador: { select: { id: true, nome: true, role: true } },
        },
      },
      mensagens: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          utilizador: { select: { id: true, nome: true, role: true } },
        },
      },
    },
  });

  const resultado = await Promise.all(
    conversas.map(async (c) => {
      const meuParticipante = c.participantes.find(
        (p) => p.utilizadorId === userId
      );
      const lidaEm = meuParticipante?.lidaEm ?? null;

      const naoLidas = await prisma.mensagem.count({
        where: {
          conversaId: c.id,
          utilizadorId: { not: userId },
          createdAt: lidaEm ? { gt: lidaEm } : undefined,
        },
      });

      const outros = c.participantes
        .filter((p) => p.utilizadorId !== userId)
        .map((p) => p.utilizador.nome);

      return {
        id: c.id,
        titulo: c.titulo,
        criadaPorId: c.criadaPorId,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        tituloDisplay:
          c.titulo || outros.join(", ") || "Conversa sem título",
        participantes: c.participantes.map((p) => ({
          id: p.id,
          conversaId: p.conversaId,
          utilizadorId: p.utilizadorId,
          lidaEm: p.lidaEm ? p.lidaEm.toISOString() : null,
          utilizador: p.utilizador,
        })),
        ultimaMensagem: c.mensagens[0]
          ? serializarMensagem(c.mensagens[0])
          : null,
        naoLidas,
      };
    })
  );

  return resultado;
}

/** Lista utilizadores ativos para selecionar participantes de uma nova conversa. */
export async function listarUtilizadores() {
  await autorizar("chat");
  return prisma.utilizador.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, email: true, role: true },
  });
}

/** Cria uma nova conversa com os participantes indicados. */
export async function criarConversa(data: {
  titulo?: string;
  participanteIds: number[];
}) {
  await autorizar("chat", "criar");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const participanteIds = [...new Set([userId, ...data.participanteIds])];
  if (participanteIds.length < 2) {
    throw new Error("Selecione pelo menos um participante");
  }

  const conversa = await prisma.conversa.create({
    data: {
      titulo: data.titulo?.trim() || null,
      criadaPorId: userId,
      participantes: {
        create: participanteIds.map((id) => ({ utilizadorId: id })),
      },
    },
    include: {
      participantes: {
        include: {
          utilizador: { select: { id: true, nome: true, role: true } },
        },
      },
    },
  });

  revalidatePath("/chat");
  return {
    id: conversa.id,
    titulo: conversa.titulo,
    criadaPorId: conversa.criadaPorId,
    createdAt: conversa.createdAt.toISOString(),
    updatedAt: conversa.updatedAt.toISOString(),
    participantes: conversa.participantes.map((p) => ({
      id: p.id,
      conversaId: p.conversaId,
      utilizadorId: p.utilizadorId,
      lidaEm: p.lidaEm ? p.lidaEm.toISOString() : null,
      utilizador: p.utilizador,
    })),
  };
}

/** Obtém as mensagens de uma conversa (apenas para participantes). */
export async function obterMensagens(conversaId: number) {
  await autorizar("chat");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const participante = await prisma.conversaParticipante.findUnique({
    where: { conversaId_utilizadorId: { conversaId, utilizadorId: userId } },
  });
  if (!participante) throw new Error("Sem acesso a esta conversa");

  const mensagens = await prisma.mensagem.findMany({
    where: { conversaId },
    orderBy: { createdAt: "asc" },
    include: {
      utilizador: { select: { id: true, nome: true, role: true } },
    },
  });

  return mensagens.map((m) => serializarMensagem(m));
}

/** Envia uma nova mensagem na conversa. */
export async function enviarMensagem(conversaId: number, conteudo: string) {
  await autorizar("chat", "criar");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const texto = conteudo.trim();
  if (!texto) throw new Error("Mensagem vazia");

  const participante = await prisma.conversaParticipante.findUnique({
    where: { conversaId_utilizadorId: { conversaId, utilizadorId: userId } },
  });
  if (!participante) throw new Error("Sem acesso a esta conversa");

  const mensagem = await prisma.mensagem.create({
    data: { conversaId, utilizadorId: userId, conteudo: texto },
    include: {
      utilizador: { select: { id: true, nome: true, role: true } },
    },
  });

  await prisma.$transaction([
    prisma.conversa.update({
      where: { id: conversaId },
      data: { updatedAt: new Date() },
    }),
    prisma.conversaParticipante.update({
      where: { conversaId_utilizadorId: { conversaId, utilizadorId: userId } },
      data: { lidaEm: new Date() },
    }),
  ]);

  revalidatePath("/chat");
  return serializarMensagem(mensagem);
}

/** Conta o total de mensagens não lidas em todas as conversas do utilizador. */
export async function contarMensagensNaoLidas() {
  await autorizar("chat");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const conversas = await prisma.conversa.findMany({
    where: {
      participantes: { some: { utilizadorId: userId } },
    },
    select: {
      id: true,
      participantes: {
        where: { utilizadorId: userId },
        select: { lidaEm: true },
      },
    },
  });

  let totalNaoLidas = 0;
  for (const c of conversas) {
    const lidaEm = c.participantes[0]?.lidaEm ?? null;
    const count = await prisma.mensagem.count({
      where: {
        conversaId: c.id,
        utilizadorId: { not: userId },
        createdAt: lidaEm ? { gt: lidaEm } : undefined,
      },
    });
    totalNaoLidas += count;
  }

  return { totalNaoLidas };
}

/** Marca a conversa como lida para o utilizador atual. */
export async function marcarConversaLida(conversaId: number) {
  await autorizar("chat");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  await prisma.conversaParticipante.update({
    where: { conversaId_utilizadorId: { conversaId, utilizadorId: userId } },
    data: { lidaEm: new Date() },
  });

  return { success: true };
}

