"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { registarHistorico } from "./historico-actions";
import { criarNotificacao } from "@/features/notificacoes/actions/notificacoes-actions";
import { autorizar } from "@/lib/permissions-server";
import { solicitacaoExameSchema, alterarPrioridadeSchema, laudoSchema } from "@/validators/schemas";
import type { Prisma } from "@prisma/client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function serializarExame(exame: any) {
  return {
    ...exame,
    dataExame: exame.dataExame?.toISOString(),
    createdAt: exame.createdAt?.toISOString(),
    updatedAt: exame.updatedAt?.toISOString(),
    ...(exame.laudos?.[0] && {
      laudos: exame.laudos.map((l: any) => ({
        ...l,
        createdAt: l.createdAt?.toISOString(),
        updatedAt: l.updatedAt?.toISOString(),
        assinadoEm: l.assinadoEm?.toISOString() ?? null,
      })),
    }),
  };
}

function serializarLaudo(laudo: any) {
  return {
    ...laudo,
    createdAt: laudo.createdAt?.toISOString(),
    updatedAt: laudo.updatedAt?.toISOString(),
    assinadoEm: laudo.assinadoEm?.toISOString() ?? null,
  };
}

// ---------------------------------------------------------------------------
// Dashboard do Médico
// ---------------------------------------------------------------------------

/**
 * Indicadores do dashboard do médico:
 * - total de solicitações
 * - exames pendentes (Solicitado / Agendado)
 * - exames concluídos (Concluído)
 * - exames urgentes (prioridade Urgente/Emergência não concluídos)
 * - pacientes aguardando atendimento
 */
export async function obterIndicadoresMedico() {
  await autorizar("medico");

  const naoConcluidos = { not: "Concluído" };
  const urgentes = { in: ["Urgente", "Emergência"] };

  const [
    totalSolicitacoes,
    examesPendentes,
    examesConcluidos,
    examesUrgentes,
    pacientesAguardando,
  ] = await Promise.all([
    prisma.exame.count(),
    prisma.exame.count({
      where: { estado: { in: ["Solicitado", "Agendado", "Paciente Confirmado"] } },
    }),
    prisma.exame.count({ where: { estado: "Concluído" } }),
    prisma.exame.count({
      where: { prioridade: urgentes, estado: naoConcluidos },
    }),
    prisma.paciente.count({
      where: { exames: { some: { estado: { in: ["Solicitado", "Agendado"] } } } },
    }),
  ]);

  // Últimas solicitações
  const ultimasSolicitacoes = await prisma.exame.findMany({
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      paciente: { select: { id: true, nome: true, numeroProcesso: true } },
      tipoExame: { select: { id: true, nome: true, modalidade: true } },
      laudos: { select: { assinado: true } },
    },
  });

  // Distribuição por tipo de exame (últimos 30 dias)
  const mesPassado = new Date();
  mesPassado.setDate(mesPassado.getDate() - 30);
  const examesMes = await prisma.exame.findMany({
    where: { createdAt: { gte: mesPassado } },
    select: { tipoExame: { select: { nome: true, modalidade: true } } },
  });

  const porTipo: Record<string, number> = {};
  for (const e of examesMes) {
    const nome = e.tipoExame?.modalidade || e.tipoExame?.nome || "Outro";
    porTipo[nome] = (porTipo[nome] || 0) + 1;
  }

  return {
    totalSolicitacoes,
    examesPendentes,
    examesConcluidos,
    examesUrgentes,
    pacientesAguardando,
    ultimasSolicitacoes: ultimasSolicitacoes.map(serializarExame),
    distribuicaoModalidades: Object.entries(porTipo).map(([modalidade, count]) => ({
      modalidade,
      count,
    })),
  };
}

// ---------------------------------------------------------------------------
// Solicitação de Exames
// ---------------------------------------------------------------------------

export async function solicitarExame(data: {
  pacienteId: number;
  tipoExameId: number;
  diagnosticoClinico: string;
  prioridade: string;
  justificacaoClinica: string;
  observacoes?: string | null;
  medicoSolicitante?: string | null;
}) {
  await autorizar("medico", "criar");
  const validated = solicitacaoExameSchema.parse(data);
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const tipo = await prisma.tipoExame.findUnique({
    where: { id: validated.tipoExameId },
  });
  if (!tipo) throw new Error("Tipo de exame não encontrado");

  const paciente = await prisma.paciente.findUnique({
    where: { id: validated.pacienteId },
  });
  if (!paciente) throw new Error("Paciente não encontrado");

  // Gerar código sequencial
  const total = await prisma.exame.count();
  const codigo = `EXM-${String(total + 1).padStart(4, "0")}`;

  const exame = await prisma.exame.create({
    data: {
      codigo,
      pacienteId: validated.pacienteId,
      tipoExameId: validated.tipoExameId,
      medicoSolicitante: validated.medicoSolicitante || session?.user?.name || null,
      observacao: validated.observacoes || null,
      estado: "Solicitado",
      prioridade: validated.prioridade,
      diagnosticoClinico: validated.diagnosticoClinico,
      justificacaoClinica: validated.justificacaoClinica,
      solicitadoPorId: userId,
    },
    include: {
      paciente: { select: { nome: true } },
      tipoExame: { select: { nome: true, modalidade: true } },
    },
  });

  await registarHistorico({
    acao: "SOLICITACAO",
    entidade: "EXAME",
    entidadeId: exame.id,
    descricao: `Solicitação de ${tipo.nome} para ${paciente.nome} (${validated.prioridade})`,
    exameId: exame.id,
    pacienteId: exame.pacienteId,
    utilizadorId: userId || undefined,
  });

  await criarNotificacao({
    titulo: "Nova solicitação de exame",
    mensagem: `${exame.tipoExame.nome} - ${exame.paciente.nome}`,
    tipo: "exame_solicitado",
    exameId: exame.id,
    pacienteId: exame.pacienteId,
  });

  revalidatePath("/medico");
  revalidatePath("/medico/acompanhamento");
  revalidatePath("/exames");
  return serializarExame(exame);
}

// ---------------------------------------------------------------------------
// Acompanhamento da Solicitação
// ---------------------------------------------------------------------------

export async function listarSolicitacoesMedico(
  page = 1,
  limit = 20,
  search = "",
  estado = "",
  prioridade = ""
) {
  await autorizar("medico");
  const skip = (page - 1) * limit;
  const where: Prisma.ExameWhereInput = {};

  if (search) {
    where.OR = [
      { paciente: { nome: { contains: search, mode: "insensitive" } } },
      { codigo: { contains: search, mode: "insensitive" } },
      { diagnosticoClinico: { contains: search, mode: "insensitive" } },
    ];
  }
  if (estado) where.estado = estado;
  if (prioridade) where.prioridade = prioridade;

  const [data, total] = await Promise.all([
    prisma.exame.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        paciente: { select: { id: true, nome: true, numeroProcesso: true } },
        tipoExame: { select: { id: true, nome: true, modalidade: true } },
        laudos: { select: { id: true, assinado: true } },
        _count: { select: { imagens: true } },
      },
    }),
    prisma.exame.count({ where }),
  ]);

  return {
    data: data.map(serializarExame),
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

// ---------------------------------------------------------------------------
// Detalhe da solicitação
// ---------------------------------------------------------------------------

export async function obterSolicitacaoMedico(id: number) {
  await autorizar("medico");
  const exame = await prisma.exame.findUnique({
    where: { id },
    include: {
      paciente: true,
      tipoExame: true,
      tecnico: true,
      procedencia: true,
      solicitadoPor: { select: { id: true, nome: true, email: true } },
      realizadoPor: { select: { id: true, nome: true } },
      laudos: {
        include: {
          medicoAssinou: { select: { id: true, nome: true, email: true } },
        },
      },
      imagens: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          exameId: true,
          filename: true,
          originalName: true,
          mimeType: true,
          tamanho: true,
          path: true,
          createdAt: true,
        },
      },
      historico: {
        orderBy: { createdAt: "desc" },
        include: { utilizador: { select: { id: true, nome: true } } },
      },
    },
  });

  if (!exame) throw new Error("Exame não encontrado");
  return serializarExame(exame);
}

// ---------------------------------------------------------------------------
// Histórico do Paciente
// ---------------------------------------------------------------------------

export async function obterHistoricoPaciente(pacienteId: number) {
  await autorizar("medico");

  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    include: {
      exames: {
        orderBy: { dataExame: "desc" },
        include: {
          tipoExame: { select: { id: true, nome: true, modalidade: true } },
          laudos: {
            select: {
              id: true,
              assinado: true,
              conteudo: true,
              assinadoEm: true,
              medicoAssinou: { select: { nome: true } },
            },
          },
          _count: { select: { imagens: true } },
        },
      },
    },
  });

  if (!paciente) throw new Error("Paciente não encontrado");

  return {
    ...paciente,
    exames: paciente.exames.map((e: any) => ({
      ...e,
      dataExame: e.dataExame?.toISOString(),
      createdAt: e.createdAt?.toISOString(),
      updatedAt: e.updatedAt?.toISOString(),
      laudos: (e.laudos || []).map((l: any) => ({
        ...l,
        assinadoEm: l.assinadoEm?.toISOString() ?? null,
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Comparação de Exames
// ---------------------------------------------------------------------------

export async function obterExamesParaComparar(pacienteId?: number) {
  await autorizar("medico");

  const where: Prisma.ExameWhereInput = {};
  if (pacienteId) where.pacienteId = pacienteId;

  const exames = await prisma.exame.findMany({
    where: {
      ...where,
      OR: [
        { imagens: { some: {} } },
        { laudos: { some: { assinado: true } } },
      ],
    },
    orderBy: { dataExame: "desc" },
    take: 100,
    include: {
      paciente: { select: { id: true, nome: true, numeroProcesso: true } },
      tipoExame: { select: { id: true, nome: true, modalidade: true } },
      imagens: {
        select: {
          id: true,
          exameId: true,
          filename: true,
          originalName: true,
          mimeType: true,
          path: true,
          createdAt: true,
        },
        take: 5,
      },
      laudos: { select: { id: true, assinado: true } },
    },
  });

  return exames.map((e: any) => ({
    ...e,
    dataExame: e.dataExame?.toISOString(),
    createdAt: e.createdAt?.toISOString(),
    imagens: e.imagens.map((i: any) => ({
      ...i,
      createdAt: i.createdAt?.toISOString(),
    })),
  }));
}

// ---------------------------------------------------------------------------
// Alterar Prioridade da Solicitação
// ---------------------------------------------------------------------------

export async function alterarPrioridadeExame(
  id: number,
  data: { prioridade: string; justificacao: string }
) {
  await autorizar("medico", "editar");
  const validated = alterarPrioridadeSchema.parse(data);

  const exame = await prisma.exame.update({
    where: { id },
    data: { prioridade: validated.prioridade },
    include: {
      paciente: { select: { nome: true } },
      tipoExame: { select: { nome: true } },
    },
  });

  await registarHistorico({
    acao: "PRIORIDADE",
    entidade: "EXAME",
    entidadeId: id,
    descricao: `Prioridade alterada para ${validated.prioridade}. Justificação: ${validated.justificacao}`,
    exameId: id,
    pacienteId: exame.pacienteId,
  });

  await criarNotificacao({
    titulo: `Prioridade alterada para ${validated.prioridade}`,
    mensagem: `${exame.tipoExame.nome} - ${exame.paciente.nome}`,
    tipo: "exame_prioridade",
    exameId: id,
    pacienteId: exame.pacienteId,
  });

  revalidatePath(`/medico/exames/${id}`);
  revalidatePath("/medico/acompanhamento");
  return serializarExame(exame);
}

// ---------------------------------------------------------------------------
// Laudo
// ---------------------------------------------------------------------------

export async function obterLaudo(exameId: number) {
  await autorizar("medico");
  const laudo = await prisma.laudo.findUnique({
    where: { exameId },
    include: {
      exame: {
        include: {
          paciente: true,
          tipoExame: true,
        },
      },
      medicoAssinou: { select: { id: true, nome: true, email: true } },
    },
  });
  if (!laudo) return null;
  return serializarLaudo(laudo);
}

export async function criarLaudo(data: { exameId: number; conteudo: string }) {
  await autorizar("medico", "criar");
  const validated = laudoSchema.parse(data);

  const laudo = await prisma.laudo.upsert({
    where: { exameId: validated.exameId },
    update: { conteudo: validated.conteudo },
    create: {
      exameId: validated.exameId,
      conteudo: validated.conteudo,
    },
  });

  await registarHistorico({
    acao: "LAUDO",
    entidade: "EXAME",
    entidadeId: validated.exameId,
    descricao: "Laudo criado/atualizado",
    exameId: validated.exameId,
  });

  revalidatePath(`/medico/exames/${validated.exameId}`);
  return serializarLaudo(laudo);
}

export async function assinarLaudo(exameId: number) {
  await autorizar("medico", "editar");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) throw new Error("Não autenticado");

  const laudo = await prisma.laudo.findUnique({ where: { exameId } });
  if (!laudo) throw new Error("Laudo não encontrado");

  // Gera uma assinatura digital simples (hash simbólico)
  const assinatura = Buffer.from(
    `${laudo.id}:${exameId}:${userId}:${new Date().toISOString()}`
  ).toString("base64");

  const atualizado = await prisma.laudo.update({
    where: { exameId },
    data: {
      assinado: true,
      assinatura,
      medicoAssinouId: userId,
      assinadoEm: new Date(),
    },
    include: {
      exame: {
        include: {
          paciente: { select: { nome: true } },
          tipoExame: { select: { nome: true } },
        },
      },
    },
  });

  await registarHistorico({
    acao: "ASSINATURA_LAUDO",
    entidade: "EXAME",
    entidadeId: exameId,
    descricao: "Laudo assinado digitalmente",
    exameId,
    utilizadorId: userId,
  });

  await criarNotificacao({
    titulo: "Laudo assinado",
    mensagem: `${atualizado.exame.tipoExame.nome} - ${atualizado.exame.paciente.nome}`,
    tipo: "laudo_assinado",
    exameId,
    pacienteId: atualizado.exame.pacienteId,
  });

  revalidatePath(`/medico/exames/${exameId}`);
  return serializarLaudo(atualizado);
}

export async function validarAssinaturaLaudo(exameId: number) {
  await autorizar("medico");
  const laudo = await prisma.laudo.findUnique({
    where: { exameId },
    include: { medicoAssinou: { select: { id: true, nome: true, email: true } } },
  });
  if (!laudo || !laudo.assinado || !laudo.assinatura) {
    return { valido: false, motivo: "Laudo não assinado" };
  }

  const dados = `Laudo #${laudo.id} assinado por ${laudo.medicoAssinouId} em ${laudo.assinadoEm?.toISOString()}`;
  const verificacao = Buffer.from(dados).toString("base64");

  return {
    valido: true,
    assinatura: laudo.assinatura,
    medico: laudo.medicoAssinou,
    assinadoEm: laudo.assinadoEm?.toISOString() ?? null,
    hashVerificacao: verificacao.slice(0, 24),
  };
}

// ---------------------------------------------------------------------------
// Agenda do Médico
// ---------------------------------------------------------------------------

export async function obterAgendaMedico() {
  await autorizar("medico");

  const hoje = new Date();
  const inicioDia = new Date(hoje.setHours(0, 0, 0, 0));
  const fimDia = new Date(hoje.setHours(23, 59, 59, 999));

  const [examesHoje, proximosExames, consultas] = await Promise.all([
    // Exames agendados ou confirmados para hoje
    prisma.exame.findMany({
      where: { dataExame: { gte: inicioDia, lte: fimDia } },
      orderBy: { dataExame: "asc" },
      include: {
        paciente: { select: { id: true, nome: true, numeroProcesso: true } },
        tipoExame: { select: { id: true, nome: true, modalidade: true } },
      },
    }),
    // Próximos exames agendados
    prisma.exame.findMany({
      where: { dataExame: { gt: fimDia }, estado: { in: ["Agendado", "Paciente Confirmado"] } },
      orderBy: { dataExame: "asc" },
      take: 10,
      include: {
        paciente: { select: { id: true, nome: true } },
        tipoExame: { select: { nome: true } },
      },
    }),
    // Turnos/consultas do técnico de hoje (como proxy simples)
    prisma.turno.findMany({
      where: { data: { gte: inicioDia, lte: fimDia } },
      orderBy: { horaInicio: "asc" },
      include: { tecnico: { select: { id: true, nome: true, especialidade: true } } },
    }),
  ]);

  return {
    examesHoje: examesHoje.map((e: any) => ({
      ...e,
      dataExame: e.dataExame?.toISOString(),
    })),
    proximosExames: proximosExames.map((e: any) => ({
      ...e,
      dataExame: e.dataExame?.toISOString(),
    })),
    consultas: consultas.map((t: any) => ({
      ...t,
      data: t.data?.toISOString(),
    })),
  };
}

// ---------------------------------------------------------------------------
// Comunicação com o Radiologista
// ---------------------------------------------------------------------------

/** Cria uma conversa com um radiologista (utilizador role TECNICO ou MEDICO) sobre um exame. */
export async function iniciarComunicacaoRadiologista(data: {
  exameId: number;
  radiologistaId: number;
  mensagem: string;
}) {
  await autorizar("medico", "criar");
  const session = await auth();
  const userId = Number(session?.user?.id);
  if (!userId) throw new Error("Não autenticado");

  const exame = await prisma.exame.findUnique({
    where: { id: data.exameId },
    include: { paciente: { select: { nome: true } } },
  });
  if (!exame) throw new Error("Exame não encontrado");

  const titulo = `Exame #${exame.id} - ${exame.paciente.nome}${
    exame.codigo ? ` (${exame.codigo})` : ""
  }`;

  // Verifica se já existe conversa para este exame
  const existente = await prisma.conversa.findFirst({
    where: {
      titulo,
      participantes: { some: { utilizadorId: userId } },
    },
  });

  let conversa = existente;

  if (!conversa) {
    conversa = await prisma.conversa.create({
      data: {
        titulo,
        criadaPorId: userId,
        participantes: {
          create: [
            { utilizadorId: userId },
            { utilizadorId: data.radiologistaId },
          ],
        },
      },
    });
  }

  const mensagem = await prisma.mensagem.create({
    data: {
      conversaId: conversa.id,
      utilizadorId: userId,
      conteudo: data.mensagem,
    },
    include: { utilizador: { select: { id: true, nome: true, role: true } } },
  });

  await prisma.conversa.update({
    where: { id: conversa.id },
    data: { updatedAt: new Date() },
  });

  // Notifica o radiologista
  await criarNotificacao({
    titulo: "Nova mensagem sobre exame",
    mensagem: `Exame #${exame.id} - ${exame.paciente.nome}`,
    tipo: "mensagem_exame",
    utilizadorId: data.radiologistaId,
    exameId: exame.id,
    pacienteId: exame.pacienteId,
  });

  revalidatePath("/chat");
  revalidatePath(`/medico/exames/${exame.id}`);
  return {
    conversaId: conversa.id,
    mensagem: {
      ...mensagem,
      createdAt: mensagem.createdAt.toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Lista de radiologistas (utilizadores TECNICO/admin para comunicar)
// ---------------------------------------------------------------------------

export async function listarRadiologistas() {
  await autorizar("medico");
  return prisma.utilizador.findMany({
    where: { ativo: true, role: { in: ["TECNICO", "MEDICO", "ADMIN"] } },
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, email: true, role: true },
  });
}

// ---------------------------------------------------------------------------
// Notificações do médico
// ---------------------------------------------------------------------------

export async function obterNotificacoesMedico() {
  await autorizar("medico");
  const data = await prisma.notificacao.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      exame: {
        select: {
          id: true,
          codigo: true,
          estado: true,
          tipoExame: { select: { nome: true } },
          paciente: { select: { nome: true } },
        },
      },
      paciente: { select: { id: true, nome: true } },
    },
  });

  return data.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Dados auxiliares (pacientes, tipos exame, radiologistas)
// ---------------------------------------------------------------------------

export async function obterDadosSolicitacao() {
  await autorizar("medico");
  const [pacientes, tiposExame, radiologistas] = await Promise.all([
    prisma.paciente.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, numeroProcesso: true },
    }),
    prisma.tipoExame.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, modalidade: true, duracaoMin: true },
    }),
    listarRadiologistas(),
  ]);

return { pacientes, tiposExame, radiologistas };
}

// ---------------------------------------------------------------------------
// Diagnóstico Assistido por IA
// ---------------------------------------------------------------------------

/**
 * Executa a análise de IA sobre as imagens de um exame e persiste o resultado.
 * O utilizador autenticado (médico) é registado como autor da análise.
 */
export async function analisarExameComIA(exameId: number, imagemId?: number) {
  await autorizar("medico", "criar");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const exame = await prisma.exame.findUnique({
    where: { id: exameId },
    include: { tipoExame: { select: { nome: true, modalidade: true } } },
  });
  if (!exame) throw new Error("Exame não encontrado");

  const servico = await import("@/services/ai.service");
  const resultados = await servico.analisarExameComIA(exameId, userId, imagemId);

  await registarHistorico({
    acao: "ANALISE_IA",
    entidade: "EXAME",
    entidadeId: exameId,
    descricao: `Diagnóstico assistido por IA executado sobre ${resultados.length} imagem(ns)`,
    exameId,
    utilizadorId: userId || undefined,
  });

  revalidatePath(`/medico/exames/${exameId}`);
  revalidatePath(`/medico/exames/${exameId}/diagnostico`);
  return resultados;
}

/**
 * Lista o histórico de análises de IA de um exame.
 */
export async function obterAnalisesIA(exameId: number) {
  await autorizar("medico");
  const servico = await import("@/services/ai.service");
  return servico.listarAnalisesIA(exameId);
}

/**
 * Obtém a análise de IA mais recente de um exame.
 */
export async function obterAnaliseMaisRecenteIA(exameId: number) {
  await autorizar("medico");
  const servico = await import("@/services/ai.service");
  return servico.obterAnaliseMaisRecente(exameId);
}

/**
 * Atualiza o pré-laudo gerado pela IA (texto editável pelo médico).
 */
export async function atualizarPreLaudoIA(analiseId: number, preLaudo: string) {
  await autorizar("medico", "editar");
  if (!preLaudo || preLaudo.trim().length < 10) {
    throw new Error("O pré-laudo deve ter pelo menos 10 caracteres");
  }
  const servico = await import("@/services/ai.service");
  const resultado = await servico.atualizarPreLaudoIA(analiseId, preLaudo);

  await registarHistorico({
    acao: "PRE_LAUDO_IA",
    entidade: "EXAME",
    entidadeId: resultado.exameId,
    descricao: "Pré-laudo de IA atualizado pelo médico",
    exameId: resultado.exameId,
  });

  revalidatePath(`/medico/exames/${resultado.exameId}/diagnostico`);
  return resultado;
}

/**
 * Transforma o pré-laudo de IA num laudo oficial (reusa criarLaudo).
 */
export async function transformarPreLaudoEmLaudo(analiseId: number, conteudo: string) {
  await autorizar("medico", "criar");
  const servico = await import("@/services/ai.service");
  const analise = await prisma.analiseIA.findUnique({ where: { id: analiseId } });
  if (!analise) throw new Error("Análise de IA não encontrada");

  const validado = laudoSchema.parse({ exameId: analise.exameId, conteudo });
  const laudo = await criarLaudo(validado);

  // Marca a análise como transformada
  await prisma.analiseIA.update({
    where: { id: analiseId },
    data: { status: "concluido" },
  });

  await registarHistorico({
    acao: "LAUDO_IA",
    entidade: "EXAME",
    entidadeId: analise.exameId,
    descricao: "Pré-laudo de IA transformado em laudo oficial",
    exameId: analise.exameId,
  });

  revalidatePath(`/medico/exames/${analise.exameId}`);
  revalidatePath(`/medico/exames/${analise.exameId}/diagnostico`);
  return serializarLaudo(laudo);
}

/**
 * Obtém os exames anteriores do mesmo paciente (para comparação na página IA).
 */
export async function obterExamesAnterioresPaciente(exameId: number) {
  await autorizar("medico");
  const exame = await prisma.exame.findUnique({
    where: { id: exameId },
    select: { pacienteId: true, dataExame: true },
  });
  if (!exame) throw new Error("Exame não encontrado");

  const exames = await prisma.exame.findMany({
    where: {
      pacienteId: exame.pacienteId,
      id: { not: exameId },
      OR: [{ imagens: { some: {} } }, { laudos: { some: { conteudo: { not: "" } } } }],
    },
    orderBy: { dataExame: "desc" },
    take: 10,
    include: {
      tipoExame: { select: { id: true, nome: true, modalidade: true } },
      imagens: {
        select: { id: true, exameId: true, filename: true, originalName: true, mimeType: true, tamanho: true, path: true, createdAt: true },
        take: 3,
      },
      laudos: { select: { id: true, assinado: true, conteudo: true, assinadoEm: true } },
    },
  });

  return exames.map((e: any) => ({
    ...e,
    dataExame: e.dataExame?.toISOString(),
    createdAt: e.createdAt?.toISOString(),
    imagens: e.imagens.map((i: any) => ({ ...i, createdAt: i.createdAt?.toISOString() })),
    laudos: (e.laudos || []).map((l: any) => ({ ...l, assinadoEm: l.assinadoEm?.toISOString() ?? null })),
  }));
}

/**
 * Dados para a página de Diagnóstico IA: exame, imagens, análises e exames anteriores.
 */
export async function obterDadosDiagnosticoIA(exameId: number) {
  await autorizar("medico");
  const [exame, analises, examesAnteriores] = await Promise.all([
    obterSolicitacaoMedico(exameId),
    obterAnalisesIA(exameId),
    obterExamesAnterioresPaciente(exameId),
  ]);

  return { exame, analises, examesAnteriores };
}

