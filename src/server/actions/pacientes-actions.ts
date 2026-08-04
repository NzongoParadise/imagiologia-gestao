"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { pacienteSchema, type PacienteInput } from "@/validators/schemas";
import { registarHistorico } from "./historico-actions";
import { autorizar } from "@/lib/permissions-server";

export async function listarPacientes(page = 1, limit = 20, search = "") {
  const skip = (page - 1) * limit;
  const where = search
    ? {
        OR: [
          { nome: { contains: search } },
          { numeroProcesso: { contains: search } },
          { nif: { contains: search } },
          { telefone: { contains: search } },
          { email: { contains: search } },
          { bi: { contains: search } },
          { documento: { contains: search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.paciente.findMany({
      where,
      skip,
      take: limit,
      orderBy: { nome: "asc" },
      include: {
        _count: { select: { exames: true } },
      },
    }),
    prisma.paciente.count({ where }),
  ]);

  return {
    data: data.map((item) => ({
      ...item,
      dataNascimento: item.dataNascimento?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    })),
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export async function obterPaciente(id: number) {
  return prisma.paciente.findUnique({
    where: { id },
    include: {
      exames: {
        include: {
          tipoExame: true,
          tecnico: true,
          procedencia: true,
          imagens: true,
        },
        orderBy: { dataExame: "desc" },
      },
      _count: { select: { exames: true } },
    },
  });
}

export async function criarPaciente(data: PacienteInput) {
  await autorizar("pacientes", "criar");
  const validated = pacienteSchema.parse(data);

  const paciente = await prisma.paciente.create({
    data: {
      numeroProcesso: validated.numeroProcesso,
      nome: validated.nome,
      dataNascimento: validated.dataNascimento ? new Date(validated.dataNascimento) : null,
      sexo: validated.sexo || null,
      telefone: validated.telefone || null,
      email: validated.email || null,
      endereco: validated.endereco || null,
      documento: validated.documento || null,
      nif: validated.nif || null,
      bi: validated.bi || null,
      foto: validated.foto || null,
      observacoes: validated.observacoes || null,
    },
  });

  await registarHistorico({
    acao: "CRIACAO",
    entidade: "PACIENTE",
    entidadeId: paciente.id,
    descricao: `Paciente ${paciente.nome} criado (Processo: ${paciente.numeroProcesso})`,
    pacienteId: paciente.id,
  });

  revalidatePath("/pacientes");
  return paciente;
}

export async function atualizarPaciente(id: number, data: PacienteInput) {
  await autorizar("pacientes", "editar");
  const validated = pacienteSchema.parse(data);

  const paciente = await prisma.paciente.update({
    where: { id },
    data: {
      numeroProcesso: validated.numeroProcesso,
      nome: validated.nome,
      dataNascimento: validated.dataNascimento ? new Date(validated.dataNascimento) : null,
      sexo: validated.sexo || null,
      telefone: validated.telefone || null,
      email: validated.email || null,
      endereco: validated.endereco || null,
      documento: validated.documento || null,
      nif: validated.nif || null,
      bi: validated.bi || null,
      foto: validated.foto || null,
      observacoes: validated.observacoes || null,
    },
  });

  await registarHistorico({
    acao: "ATUALIZACAO",
    entidade: "PACIENTE",
    entidadeId: paciente.id,
    descricao: `Paciente ${paciente.nome} atualizado`,
    pacienteId: paciente.id,
  });

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
  return paciente;
}

export async function eliminarPaciente(id: number) {
  await autorizar("pacientes", "eliminar");
  const paciente = await prisma.paciente.findUnique({ where: { id } });
  if (!paciente) throw new Error("Paciente não encontrado");

  await prisma.paciente.delete({ where: { id } });

  await registarHistorico({
    acao: "ELIMINACAO",
    entidade: "PACIENTE",
    entidadeId: id,
    descricao: `Paciente ${paciente.nome} eliminado`,
  });

  revalidatePath("/pacientes");
}

export async function pesquisarPacientes(query: string) {
  if (!query || query.length < 2) return [];
  return prisma.paciente.findMany({
    where: {
      OR: [
        { nome: { contains: query } },
        { nif: { contains: query } },
        { telefone: { contains: query } },
      ],
    },
    take: 10,
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, nif: true },
  });
}

