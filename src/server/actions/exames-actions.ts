"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exameSchema, type ExameInput } from "@/validators/schemas";
import { registarHistorico } from "./historico-actions";
import { criarNotificacao } from "@/features/notificacoes/actions/notificacoes-actions";
import { autorizar } from "@/lib/permissions-server";
import type { Prisma } from "@prisma/client";

export async function listarExames(page = 1, limit = 20, search = "", estado = "") {
  const skip = (page - 1) * limit;
  const where: Prisma.ExameWhereInput = {};

  if (search) {
    where.OR = [
      { paciente: { nome: { contains: search } } },
      { codigo: { contains: search } },
      { medicoSolicitante: { contains: search } },
      { observacao: { contains: search } },
    ];
  }

  if (estado) {
    where.estado = estado;
  }

  const [data, total] = await Promise.all([
    prisma.exame.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dataExame: "desc" },
      include: {
        paciente: { select: { id: true, nome: true } },
        tipoExame: { select: { id: true, nome: true, modalidade: true } },
        tecnico: { select: { id: true, nome: true } },
        procedencia: { select: { id: true, nome: true } },
        _count: { select: { imagens: true } },
      },
    }),
    prisma.exame.count({ where }),
  ]);

  return {
    data: data.map((item) => ({
      ...item,
      dataExame: item.dataExame.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export async function obterExame(id: number) {
  return prisma.exame.findUnique({
    where: { id },
    include: {
      paciente: true,
      tipoExame: true,
      tecnico: true,
      procedencia: true,
      imagens: { orderBy: { createdAt: "desc" } },
      realizadoPor: { select: { id: true, nome: true } },
    },
  });
}

export async function criarExame(data: ExameInput) {
  await autorizar("exames", "criar");
  const validated = exameSchema.parse(data);

  const exame = await prisma.exame.create({
    data: {
      pacienteId: validated.pacienteId,
      tipoExameId: validated.tipoExameId,
      tecnicoId: validated.tecnicoId || null,
      procedenciaId: validated.procedenciaId || null,
      medicoSolicitante: validated.medicoSolicitante || null,
      observacao: validated.observacao || null,
      estado: validated.estado || "Pendente",
      dataExame: validated.dataExame ? new Date(validated.dataExame) : new Date(),
    },
    include: {
      paciente: { select: { nome: true } },
      tipoExame: { select: { nome: true } },
    },
  });

  await registarHistorico({
    acao: "CRIACAO",
    entidade: "EXAME",
    entidadeId: exame.id,
    descricao: `Exame #${exame.id} criado`,
    exameId: exame.id,
    pacienteId: exame.pacienteId,
  });

  await criarNotificacao({
    titulo: "Novo exame criado",
    mensagem: `${exame.tipoExame.nome} - ${exame.paciente.nome}`,
    tipo: "exame_criado",
    exameId: exame.id,
    pacienteId: exame.pacienteId,
  });

  revalidatePath("/exames");
  revalidatePath(`/pacientes/${exame.pacienteId}`);
  return exame;
}

export async function atualizarExame(id: number, data: Partial<ExameInput>) {
  await autorizar("exames", "editar");
  const exame = await prisma.exame.update({
    where: { id },
    data: {
      tipoExameId: data.tipoExameId,
      tecnicoId: data.tecnicoId ?? null,
      procedenciaId: data.procedenciaId ?? null,
      medicoSolicitante: data.medicoSolicitante ?? null,
      observacao: data.observacao ?? null,
      estado: data.estado,
      dataExame: data.dataExame ? new Date(data.dataExame) : undefined,
    },
  });

  await registarHistorico({
    acao: "ATUALIZACAO",
    entidade: "EXAME",
    entidadeId: exame.id,
    descricao: `Exame #${exame.id} atualizado para ${exame.estado}`,
    exameId: exame.id,
    pacienteId: exame.pacienteId,
  });

  revalidatePath("/exames");
  revalidatePath(`/exames/${id}`);
  revalidatePath(`/pacientes/${exame.pacienteId}`);
  return exame;
}

export async function atualizarEstadoExame(id: number, estado: string) {
  await autorizar("exames", "editar");
  const exame = await prisma.exame.update({
    where: { id },
    data: { estado },
    include: {
      paciente: { select: { nome: true } },
      tipoExame: { select: { nome: true } },
    },
  });

  await registarHistorico({
    acao: "ESTADO",
    entidade: "EXAME",
    entidadeId: exame.id,
    descricao: `Exame #${exame.id} alterado para ${estado}`,
    exameId: exame.id,
    pacienteId: exame.pacienteId,
  });

  await criarNotificacao({
    titulo: `Exame ${estado.toLowerCase()}`,
    mensagem: `${exame.tipoExame.nome} - ${exame.paciente.nome}`,
    tipo: "exame_estado",
    exameId: exame.id,
    pacienteId: exame.pacienteId,
  });

  revalidatePath("/exames");
  revalidatePath(`/exames/${id}`);
  return exame;
}

export async function eliminarExame(id: number) {
  await autorizar("exames", "eliminar");
  const exame = await prisma.exame.findUnique({ where: { id } });
  if (!exame) throw new Error("Exame não encontrado");

  await prisma.exame.delete({ where: { id } });

  await registarHistorico({
    acao: "ELIMINACAO",
    entidade: "EXAME",
    entidadeId: id,
    descricao: `Exame #${id} eliminado`,
    pacienteId: exame.pacienteId,
  });

  revalidatePath("/exames");
  revalidatePath(`/pacientes/${exame.pacienteId}`);
}

export async function getExamesCount() {
  const [total, hoje, esteMes] = await Promise.all([
    prisma.exame.count(),
    prisma.exame.count({
      where: {
        dataExame: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.exame.count({
      where: {
        dataExame: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        },
      },
    }),
  ]);

  return { total, hoje, esteMes };
}

export async function getExamesPorModalidade() {
  const exames = await prisma.exame.groupBy({
    by: ["tipoExameId"],
    _count: { id: true },
  });

  const tipos = await prisma.tipoExame.findMany({
    select: { id: true, nome: true, modalidade: true },
  });

  return exames.map((e) => {
    const tipo = tipos.find((t) => t.id === e.tipoExameId);
    return {
      modalidade: tipo?.modalidade || tipo?.nome || "Desconhecido",
      count: e._count.id,
    };
  });
}

export async function getExamesMensais() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const exames = await prisma.exame.findMany({
    where: { dataExame: { gte: sixMonthsAgo } },
    select: { dataExame: true },
    orderBy: { dataExame: "asc" },
  });

  const monthlyMap: Record<string, number> = {};
  exames.forEach((e) => {
    const key = `${e.dataExame.getFullYear()}-${String(e.dataExame.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + 1;
  });

  return Object.entries(monthlyMap).map(([mes, total]) => ({ mes, total }));
}

