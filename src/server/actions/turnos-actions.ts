"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { turnoSchema, type TurnoInput } from "@/validators/schemas";
import { registarHistorico } from "./historico-actions";
import { auth } from "@/lib/auth";
import { autorizar } from "@/lib/permissions-server";

export async function listarTurnos() {
  return prisma.turno.findMany({
    orderBy: [{ data: "desc" }, { horaInicio: "asc" }],
    include: {
      tecnico: { select: { id: true, nome: true, especialidade: true } },
      createdBy: { select: { id: true, nome: true } },
    },
  });
}

export async function obterTurno(id: number) {
  return prisma.turno.findUnique({
    where: { id },
    include: {
      tecnico: { select: { id: true, nome: true, especialidade: true } },
      createdBy: { select: { id: true, nome: true } },
    },
  });
}

export async function criarTurno(data: TurnoInput) {
  await autorizar("turnos", "criar");
  const validated = turnoSchema.parse(data);
  const session = await auth();
  const utilizadorId = session?.user?.id ? parseInt(session.user.id) : null;

  const turno = await prisma.turno.create({
    data: {
      tecnicoId: validated.tecnicoId,
      data: new Date(validated.data),
      horaInicio: validated.horaInicio,
      horaFim: validated.horaFim,
      tipo: validated.tipo,
      estado: validated.estado || "Agendado",
      observacao: validated.observacao || null,
      createdById: utilizadorId,
    },
  });

  const tecnico = await prisma.tecnico.findUnique({ where: { id: validated.tecnicoId } });

  await registarHistorico({
    acao: "CRIACAO",
    entidade: "TURNO",
    entidadeId: turno.id,
    descricao: `Turno criado para ${tecnico?.nome || "técnico"} em ${new Date(validated.data).toLocaleDateString("pt-PT")} (${validated.horaInicio}-${validated.horaFim})`,
  });

  revalidatePath("/turnos");
  return turno;
}

export async function atualizarTurno(id: number, data: TurnoInput) {
  await autorizar("turnos", "editar");
  const validated = turnoSchema.parse(data);

  const turno = await prisma.turno.update({
    where: { id },
    data: {
      tecnicoId: validated.tecnicoId,
      data: new Date(validated.data),
      horaInicio: validated.horaInicio,
      horaFim: validated.horaFim,
      tipo: validated.tipo,
      estado: validated.estado || "Agendado",
      observacao: validated.observacao || null,
    },
  });

  const tecnico = await prisma.tecnico.findUnique({ where: { id: validated.tecnicoId } });

  await registarHistorico({
    acao: "ATUALIZACAO",
    entidade: "TURNO",
    entidadeId: id,
    descricao: `Turno atualizado para ${tecnico?.nome || "técnico"} em ${new Date(validated.data).toLocaleDateString("pt-PT")}`,
  });

  revalidatePath("/turnos");
  return turno;
}

export async function eliminarTurno(id: number) {
  await autorizar("turnos", "eliminar");
  const turno = await prisma.turno.findUnique({
    where: { id },
    include: { tecnico: { select: { nome: true } } },
  });

  if (!turno) throw new Error("Turno não encontrado");

  await prisma.turno.delete({ where: { id } });

  await registarHistorico({
    acao: "ELIMINACAO",
    entidade: "TURNO",
    entidadeId: id,
    descricao: `Turno de ${turno.tecnico.nome} em ${turno.data.toLocaleDateString("pt-PT")} eliminado`,
  });

  revalidatePath("/turnos");
}

