"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { autorizar } from "@/lib/permissions-server";
import type { ChamadaDTO } from "../types";

function serializarChamada(c: {
  id: number;
  chamadorId: number;
  receptorId: number;
  conversaId: number | null;
  estado: string;
  iniciadoEm: Date;
  aceiteEm: Date | null;
  terminadoEm: Date | null;
  duracaoSeg: number;
  motivoFim: string | null;
  chamador: { id: number; nome: string; role: string; ultimoVisto: Date | null };
  receptor: { id: number; nome: string; role: string; ultimoVisto: Date | null };
}): ChamadaDTO {
  return {
    id: c.id,
    chamadorId: c.chamadorId,
    receptorId: c.receptorId,
    conversaId: c.conversaId,
    estado: c.estado as ChamadaDTO["estado"],
    iniciadoEm: c.iniciadoEm.toISOString(),
    aceiteEm: c.aceiteEm?.toISOString() ?? null,
    terminadoEm: c.terminadoEm?.toISOString() ?? null,
    duracaoSeg: c.duracaoSeg,
    motivoFim: c.motivoFim,
    chamador: {
      id: c.chamador.id,
      nome: c.chamador.nome,
      role: c.chamador.role,
      ultimoVisto: c.chamador.ultimoVisto?.toISOString() ?? null,
    },
    receptor: {
      id: c.receptor.id,
      nome: c.receptor.nome,
      role: c.receptor.role,
      ultimoVisto: c.receptor.ultimoVisto?.toISOString() ?? null,
    },
  };
}

/**
 * Inicia uma chamada de voz para um utilizador.
 * Pode ser associada a uma conversa de chat existente.
 */
export async function iniciarChamada(data: {
  receptorId: number;
  conversaId?: number;
}) {
  await autorizar("chat", "criar");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const chamadorId = Number(session.user.id);

  if (chamadorId === data.receptorId) {
    throw new Error("Nao pode ligar para si mesmo");
  }

  // Verificar se já existe uma chamada ativa entre os dois
  const chamadaAtiva = await prisma.chamadaVoz.findFirst({
    where: {
      OR: [
        { chamadorId, receptorId: data.receptorId },
        { chamadorId: data.receptorId, receptorId: chamadorId },
      ],
      estado: { in: ["A_CHAMAR", "EM_CURSO"] },
    },
  });

  if (chamadaAtiva) {
    throw new Error("Ja existe uma chamada ativa com este utilizador");
  }

  const chamada = await prisma.chamadaVoz.create({
    data: {
      chamadorId,
      receptorId: data.receptorId,
      conversaId: data.conversaId ?? null,
      estado: "A_CHAMAR",
    },
    include: {
      chamador: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
      receptor: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
    },
  });

  revalidatePath("/chat");
  return serializarChamada(chamada);
}

/**
 * Obtém as chamadas pendentes (A_CHAMAR) para o utilizador atual.
 */
export async function obterChamadasPendentes() {
  await autorizar("chat");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const chamadas = await prisma.chamadaVoz.findMany({
    where: {
      receptorId: userId,
      estado: "A_CHAMAR",
    },
    orderBy: { iniciadoEm: "desc" },
    include: {
      chamador: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
      receptor: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
    },
  });

  return chamadas.map((c) => serializarChamada(c));
}

/**
 * Obtém a chamada ativa do utilizador atual.
 *
 * NÃO devolve chamadas A_CHAMAR em que o utilizador é apenas RECEPTOR:
 * essas devem ser tratadas como "chamadas recebidas" (ver `obterChamadasPendentes`),
 * estilo WhatsApp/Messenger. Assim, o modal de chamada recebida (botão Atender)
 * nunca é sobreposto pelo modal de chamada ativa (botão Terminar).
 *
 * Devolve apenas:
 *   - Chamadas A_CHAMAR em que o utilizador é o CHAMADOR (a aguardar resposta);
 *   - Chamadas EM_CURSO em que o utilizador participa (chamador ou receptor).
 */
export async function obterChamadaAtiva() {
  await autorizar("chat");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const chamada = await prisma.chamadaVoz.findFirst({
    where: {
      OR: [
        // Sou o chamador de uma chamada a aguardar resposta
        { chamadorId: userId, estado: "A_CHAMAR" },
        // Estou a participar numa chamada em curso
        {
          estado: "EM_CURSO",
          OR: [{ chamadorId: userId }, { receptorId: userId }],
        },
      ],
    },
    orderBy: { iniciadoEm: "desc" },
    include: {
      chamador: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
      receptor: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
    },
  });

  return chamada ? serializarChamada(chamada) : null;
}

/**
 * Aceita uma chamada pendente.
 */
export async function aceitarChamada(chamadaId: number) {
  await autorizar("chat", "criar");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const chamada = await prisma.chamadaVoz.findUnique({
    where: { id: chamadaId },
  });

  if (!chamada) throw new Error("Chamada nao encontrada");
  if (chamada.receptorId !== userId) throw new Error("Nao e o destinatario");
  if (chamada.estado !== "A_CHAMAR") throw new Error("Chamada ja foi processada");

  const atualizada = await prisma.chamadaVoz.update({
    where: { id: chamadaId },
    data: {
      estado: "EM_CURSO",
      aceiteEm: new Date(),
    },
    include: {
      chamador: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
      receptor: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
    },
  });

  revalidatePath("/chat");
  return serializarChamada(atualizada);
}

/**
 * Rejeita uma chamada pendente.
 */
export async function rejeitarChamada(chamadaId: number) {
  await autorizar("chat", "criar");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const chamada = await prisma.chamadaVoz.findUnique({
    where: { id: chamadaId },
  });

  if (!chamada) throw new Error("Chamada nao encontrada");
  if (chamada.receptorId !== userId) throw new Error("Nao e o destinatario");
  if (chamada.estado !== "A_CHAMAR") throw new Error("Chamada ja foi processada");

  const atualizada = await prisma.chamadaVoz.update({
    where: { id: chamadaId },
    data: {
      estado: "REJEITADA",
      terminadoEm: new Date(),
      motivoFim: "Rejeitada pelo utilizador",
    },
    include: {
      chamador: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
      receptor: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
    },
  });

  revalidatePath("/chat");
  return serializarChamada(atualizada);
}

/**
 * Termina uma chamada ativa.
 */
export async function terminarChamada(chamadaId: number) {
  await autorizar("chat", "criar");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const chamada = await prisma.chamadaVoz.findUnique({
    where: { id: chamadaId },
  });

  if (!chamada) throw new Error("Chamada nao encontrada");
  if (chamada.chamadorId !== userId && chamada.receptorId !== userId) {
    throw new Error("Nao participa nesta chamada");
  }
  if (chamada.estado !== "A_CHAMAR" && chamada.estado !== "EM_CURSO") {
    throw new Error("Chamada ja foi terminada");
  }

  const agora = new Date();
  let duracaoSeg = 0;
  if (chamada.aceiteEm) {
    duracaoSeg = Math.floor((agora.getTime() - chamada.aceiteEm.getTime()) / 1000);
  }

  const atualizada = await prisma.chamadaVoz.update({
    where: { id: chamadaId },
    data: {
      estado: "TERMINADA",
      terminadoEm: agora,
      duracaoSeg,
      motivoFim: chamada.estado === "A_CHAMAR" ? "Nao atendida" : "Chamada terminada",
    },
    include: {
      chamador: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
      receptor: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
    },
  });

  revalidatePath("/chat");
  return serializarChamada(atualizada);
}

/**
 * Cancela uma chamada que o próprio utilizador iniciou (ainda a chamar).
 */
export async function cancelarChamada(chamadaId: number) {
  await autorizar("chat", "criar");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const chamada = await prisma.chamadaVoz.findUnique({
    where: { id: chamadaId },
  });

  if (!chamada) throw new Error("Chamada nao encontrada");
  if (chamada.chamadorId !== userId) throw new Error("Nao foi o chamador");
  if (chamada.estado !== "A_CHAMAR") throw new Error("Chamada ja foi processada");

  const atualizada = await prisma.chamadaVoz.update({
    where: { id: chamadaId },
    data: {
      estado: "CANCELADA",
      terminadoEm: new Date(),
      motivoFim: "Cancelada pelo chamador",
    },
    include: {
      chamador: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
      receptor: { select: { id: true, nome: true, role: true, ultimoVisto: true } },
    },
  });

  revalidatePath("/chat");
  return serializarChamada(atualizada);
}

// ---------------------------------------------------------------------------
// Sinalização WebRTC
// ---------------------------------------------------------------------------

/**
 * Envia um sinal WebRTC (offer, answer, ICE candidate) para uma chamada.
 */
export async function enviarSinalVoip(data: {
  chamadaId: number;
  tipo: "offer" | "answer" | "ice";
  conteudo: string;
}) {
  await autorizar("chat", "criar");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const chamada = await prisma.chamadaVoz.findUnique({
    where: { id: data.chamadaId },
  });

  if (!chamada) throw new Error("Chamada nao encontrada");
  if (chamada.chamadorId !== userId && chamada.receptorId !== userId) {
    throw new Error("Nao participa nesta chamada");
  }

  const sinal = await prisma.sinalVoip.create({
    data: {
      chamadaId: data.chamadaId,
      utilizadorId: userId,
      tipo: data.tipo,
      conteudo: data.conteudo,
    },
  });

  return {
    id: sinal.id,
    chamadaId: sinal.chamadaId,
    utilizadorId: sinal.utilizadorId,
    tipo: sinal.tipo,
    conteudo: sinal.conteudo,
    createdAt: sinal.createdAt.toISOString(),
  };
}

/**
 * Obtém os sinais WebRTC de uma chamada que não foram enviados pelo próprio utilizador.
 * Útil para polling de sinalização.
 */
export async function obterSinaisVoip(chamadaId: number, ultimoId: number = 0) {
  await autorizar("chat");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nao autenticado");
  const userId = Number(session.user.id);

  const chamada = await prisma.chamadaVoz.findUnique({
    where: { id: chamadaId },
  });

  if (!chamada) throw new Error("Chamada nao encontrada");
  if (chamada.chamadorId !== userId && chamada.receptorId !== userId) {
    throw new Error("Nao participa nesta chamada");
  }

  const sinais = await prisma.sinalVoip.findMany({
    where: {
      chamadaId,
      utilizadorId: { not: userId },
      id: { gt: ultimoId },
    },
    orderBy: { createdAt: "asc" },
  });

  return sinais.map((s) => ({
    id: s.id,
    chamadaId: s.chamadaId,
    utilizadorId: s.utilizadorId,
    tipo: s.tipo,
    conteudo: s.conteudo,
    createdAt: s.createdAt.toISOString(),
  }));
}