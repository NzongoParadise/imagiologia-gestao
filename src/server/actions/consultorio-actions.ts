"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

// Criar consultório
export async function criarConsultorio(data: {
  numero: string;
  nome: string;
  especialidadeId?: number;
  andar?: string;
  bloco?: string;
  capacidade?: number;
  equipamentos?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const consultorio = await prisma.consultorio.create({
    data: {
      ...data,
      capacidade: data.capacidade || 1,
      criadoPorId: parseInt(session.user.id),
    },
    include: {
      especialidade: true,
      criadoPor: true,
    },
  });

  return consultorio;
}

// Listar consultórios
export async function listarConsultorios(filters?: {
  especialidadeId?: number;
  ativo?: boolean;
}) {
  const consultórios = await prisma.consultorio.findMany({
    where: {
      ...(filters?.especialidadeId && { especialidadeId: filters.especialidadeId }),
      ...(filters?.ativo !== undefined && { ativo: filters.ativo }),
    },
    include: {
      especialidade: true,
      criadoPor: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
      atendimentos: {
        where: {
          estado: { not: "CONCLUIDO" },
        },
        include: {
          paciente: true,
          consulta: true,
        },
      },
      agendamentos: {
        where: {
          estado: { not: "CONCLUIDO" },
        },
        include: {
          paciente: true,
        },
      },
    },
    orderBy: {
      numero: "asc",
    },
  });

  return consultórios;
}

// Obter consultório com suas consultas
export async function obterConsultorioComConsultas(consultorioId: number) {
  const consultorio = await prisma.consultorio.findUnique({
    where: { id: consultorioId },
    include: {
      especialidade: true,
      criadoPor: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
      atendimentos: {
        include: {
          paciente: true,
          consulta: {
            include: {
              medico: {
                select: {
                  id: true,
                  nome: true,
                  email: true,
                },
              },
            },
          },
          triagem: true,
          filaAtendimento: true,
        },
        orderBy: {
          criadoEm: "desc",
        },
      },
      agendamentos: {
        include: {
          paciente: true,
          medico: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
        orderBy: {
          dataHora: "asc",
        },
      },
    },
  });

  if (!consultorio) {
    throw new Error("Consultório não encontrado");
  }

  return consultorio;
}

// Atualizar consultório
export async function atualizarConsultorio(
  consultorioId: number,
  data: {
    numero?: string;
    nome?: string;
    especialidadeId?: number | null;
    andar?: string;
    bloco?: string;
    capacidade?: number;
    equipamentos?: string;
    ativo?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  const consultorio = await prisma.consultorio.update({
    where: { id: consultorioId },
    data,
    include: {
      especialidade: true,
    },
  });

  return consultorio;
}

// Deletar consultório
export async function deletarConsultorio(consultorioId: number) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Não autenticado");
  }

  // Verificar se tem atendimentos
  const atendimentos = await prisma.atendimento.count({
    where: { consultorioId },
  });

  if (atendimentos > 0) {
    throw new Error("Não é possível deletar consultório com atendimentos");
  }

  await prisma.consultorio.delete({
    where: { id: consultorioId },
  });
}

// Obter consultas ativas por consultório
export async function obterConsultasAtivasPorConsultorio(consultorioId: number) {
  const consultas = await prisma.atendimento.findMany({
    where: {
      consultorioId,
      tipo: "CONSULTA",
      estado: {
        in: ["AGUARDANDO", "EM_TRIAGEM", "EM_ATENDIMENTO"],
      },
    },
    include: {
      paciente: true,
      consulta: {
        include: {
          medico: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      },
      triagem: true,
      filaAtendimento: true,
    },
    orderBy: {
      criadoEm: "asc",
    },
  });

  return consultas;
}

// Estatísticas do consultório
export async function obterEstatisticasConsultorio(consultorioId: number) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const consultasHoje = await prisma.atendimento.count({
    where: {
      consultorioId,
      tipo: "CONSULTA",
      criadoEm: {
        gte: hoje,
      },
    },
  });

  const consultasAtivasAgora = await prisma.atendimento.count({
    where: {
      consultorioId,
      tipo: "CONSULTA",
      estado: { in: ["EM_ATENDIMENTO", "AGUARDANDO"] },
    },
  });

  const agendamentosProximos = await prisma.agendamentoConsulta.count({
    where: {
      consultorioId,
      dataHora: {
        gte: new Date(),
      },
      estado: { in: ["AGENDADO", "CONFIRMADO"] },
    },
  });

  return {
    consultasHoje,
    consultasAtivasAgora,
    agendamentosProximos,
  };
}
