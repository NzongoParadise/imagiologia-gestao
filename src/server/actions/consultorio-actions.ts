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

// ============================================================================
// DISPONIBILIDADES
// ============================================================================

// Definir horário de funcionamento
export async function definirDisponibilidade(data: {
  consultorioId: number;
  diaSemana: number;
  horaAbertura: string;
  horaFechamento: string;
}) {
  const disponibilidade = await prisma.disponibilidadeConsultorio.upsert({
    where: {
      consultorioId_diaSemana: {
        consultorioId: data.consultorioId,
        diaSemana: data.diaSemana,
      },
    },
    update: {
      horaAbertura: data.horaAbertura,
      horaFechamento: data.horaFechamento,
      ativo: true,
    },
    create: {
      consultorioId: data.consultorioId,
      diaSemana: data.diaSemana,
      horaAbertura: data.horaAbertura,
      horaFechamento: data.horaFechamento,
    },
  });

  return disponibilidade;
}

// Obter disponibilidades do consultório
export async function obterDisponibilidades(consultorioId: number) {
  const disponibilidades = await prisma.disponibilidadeConsultorio.findMany({
    where: {
      consultorioId,
      ativo: true,
    },
    orderBy: {
      diaSemana: "asc",
    },
  });

  return disponibilidades;
}

// Desativar horário
export async function desativarDisponibilidade(
  consultorioId: number,
  diaSemana: number
) {
  await prisma.disponibilidadeConsultorio.update({
    where: {
      consultorioId_diaSemana: {
        consultorioId,
        diaSemana,
      },
    },
    data: {
      ativo: false,
    },
  });
}

// Verificar se consultório está disponível
export async function verificarDisponibilidade(
  consultorioId: number,
  dataHora: Date
) {
  const diaSemana = dataHora.getDay();
  const horas = dataHora.getHours().toString().padStart(2, "0");
  const minutos = dataHora.getMinutes().toString().padStart(2, "0");
  const horaAtual = `${horas}:${minutos}`;

  const disponibilidade = await prisma.disponibilidadeConsultorio.findFirst({
    where: {
      consultorioId,
      diaSemana,
      ativo: true,
      horaAbertura: { lte: horaAtual },
      horaFechamento: { gte: horaAtual },
    },
  });

  return !!disponibilidade;
}
