"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { autorizar } from "@/lib/permissions-server";
import { registarHistorico } from "./historico-actions";

// ===========================================================================
// MÓDULO 01 — ATENDIMENTO (Consultas e Urgências)
// Server Actions
// ===========================================================================

// ---------------------------------------------------------------------------
// Listagens / Consultas
// ---------------------------------------------------------------------------

export async function listarEspecialidades() {
  await autorizar("atendimento", "ver");
  return prisma.especialidade.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
}

export async function listarBancosUrgencia() {
  await autorizar("atendimento", "ver");
  return prisma.bancoUrgencia.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
}

export async function listarClassificacoesRisco() {
  await autorizar("atendimento", "ver");
  return prisma.classificacaoRisco.findMany({
    where: { ativo: true },
    orderBy: { nivel: "asc" },
  });
}

export async function listarAtendimentos(
  data?: string,
  tipo?: string,
  estado?: string,
  page = 1,
  limit = 20
) {
  await autorizar("atendimento", "ver");
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};

  if (data) {
    const inicio = new Date(`${data}T00:00:00.000Z`);
    const fim = new Date(`${data}T23:59:59.999Z`);
    where.criadoEm = { gte: inicio, lte: fim };
  }
  if (tipo) where.tipo = tipo;
  if (estado) where.estado = estado;

  const [dataLista, total] = await Promise.all([
    prisma.atendimento.findMany({
      where,
      skip,
      take: limit,
      orderBy: { criadoEm: "desc" },
      include: {
        paciente: { select: { id: true, nome: true, numeroProcesso: true } },
        especialidade: { select: { id: true, nome: true } },
        criadoPor: { select: { id: true, nome: true } },
        consulta: true,
        urgencia: {
          include: {
            bancoUrgencia: { select: { id: true, nome: true, tipo: true } },
            classificacao: { select: { id: true, nome: true, cor: true } },
          },
        },
        triagem: {
          include: { classificacao: { select: { id: true, nome: true, cor: true, nivel: true } } },
        },
        senha: { select: { id: true, codigo: true, status: true } },
        filaAtendimento: { select: { id: true, posicao: true, status: true } },
      },
    }),
    prisma.atendimento.count({ where }),
  ]);

  return {
    data: dataLista,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

export async function obterAtendimento(id: number) {
  await autorizar("atendimento", "ver");
  return prisma.atendimento.findUnique({
    where: { id },
    include: {
      paciente: true,
      especialidade: true,
      criadoPor: { select: { id: true, nome: true } },
      consulta: { include: { medico: { select: { id: true, nome: true } } } },
      urgencia: {
        include: {
          bancoUrgencia: true,
          classificacao: true,
          medico: { select: { id: true, nome: true } },
        },
      },
      triagem: {
        include: {
          classificacao: true,
          enfermeiro: { select: { id: true, nome: true } },
        },
      },
      senha: true,
      filaAtendimento: true,
      encaminhamentos: true,
    },
  });
}

// ---------------------------------------------------------------------------
// Gerar código sequencial
// ---------------------------------------------------------------------------

async function gerarCodigoAtendimento(tipo: string): Promise<string> {
  const ano = new Date().getFullYear();
  const prefixo = tipo === "URGENCIA" ? "URG" : "CON";
  const ultimo = await prisma.atendimento.findFirst({
    where: { tipo, criadoEm: { gte: new Date(`${ano}-01-01`) } },
    orderBy: { criadoEm: "desc" },
    select: { codigo: true },
  });

  let seq = 1;
  if (ultimo?.codigo) {
    const partes = ultimo.codigo.split("-");
    seq = parseInt(partes[partes.length - 1] || "0", 10) + 1;
  }

  return `AT-${ano}-${prefixo}-${String(seq).padStart(4, "0")}`;
}

// ---------------------------------------------------------------------------
// Consulta — criar atendimento
// ---------------------------------------------------------------------------

export async function iniciarConsulta(input: {
  pacienteId: number;
  especialidadeId?: number;
  agendamentoId?: number;
  procedenciaId?: number;
  origem?: string;
  prioridade?: string;
  motivo?: string;
}) {
  const usuario = await autorizar("atendimento", "criar");

  if (!Number.isInteger(input.pacienteId) || input.pacienteId <= 0) {
    throw new Error("Selecione um paciente válido");
  }

  const codigo = await gerarCodigoAtendimento("CONSULTA");
  const criadoPorId = usuario.userId ? Number(usuario.userId) : null;

  // Transação: criar Atendimento + Consulta + Fila + Senha
  const atendimento = await prisma.$transaction(async (tx) => {
    const novo = await tx.atendimento.create({
      data: {
        codigo,
        tipo: "CONSULTA",
        pacienteId: input.pacienteId,
        especialidadeId: input.especialidadeId || null,
        procedenciaId: input.procedenciaId || null,
        origem: input.origem || "rececao",
        prioridade: input.prioridade || "Normal",
        estado: "AGUARDANDO",
        criadoPorId,
      },
    });

    await tx.atendimentoConsulta.create({
      data: {
        atendimentoId: novo.id,
        pacienteId: input.pacienteId,
        agendamentoId: input.agendamentoId || null,
        especialidadeId: input.especialidadeId || null,
        motivo: input.motivo || null,
        criadoPorId,
      },
    });

    // senha mais recente da fila de consultas de hoje
    const ultimaPosicao = await tx.filaAtendimento.aggregate({
      where: { tipoFila: "CONSULTA", status: { in: ["EM_FILA", "CHAMADO"] } },
      _max: { posicao: true },
    });

    await tx.filaAtendimento.create({
      data: {
        atendimentoId: novo.id,
        tipoFila: "CONSULTA",
        especialidadeId: input.especialidadeId || null,
        posicao: (ultimaPosicao._max.posicao || 0) + 1,
        criadoPorId,
      },
    });

    const codigoSenha = await tx.senhaAtendimento.findFirst({
      where: { tipo: "CONSULTA" },
      orderBy: { emitidaEm: "desc" },
      select: { codigo: true },
    });

    let proximaSenha = 1;
    if (codigoSenha?.codigo) {
      const num = parseInt(codigoSenha.codigo.replace("C-", ""), 10);
      if (!isNaN(num)) proximaSenha = num + 1;
    }

    const senha = `C-${String(proximaSenha).padStart(3, "0")}`;
    await tx.senhaAtendimento.create({
      data: {
        codigo: senha,
        tipo: "CONSULTA",
        pacienteId: input.pacienteId,
        atendimentoId: novo.id,
        emitidaPorId: criadoPorId,
      },
    });

    return { ...novo, senha };
  });

  await registarHistorico({
    acao: "CRIACAO",
    entidade: "ATENDIMENTO",
    entidadeId: atendimento.id,
    descricao: `Atendimento de consulta iniciado (${codigo}) — senha ${atendimento.senha}`,
    pacienteId: input.pacienteId,
  });

  revalidatePath("/atendimento");
  revalidatePath("/atendimento/consultas");
  return atendimento;
}

// ---------------------------------------------------------------------------
// Urgência — criar atendimento
// ---------------------------------------------------------------------------

export async function iniciarUrgencia(input: {
  pacienteId: number;
  bancoUrgenciaId?: number;
  queixaPrincipal?: string;
  procedenciaId?: number;
  origem?: string;
  prioridade?: string;
}) {
  const usuario = await autorizar("atendimento", "criar");

  if (!Number.isInteger(input.pacienteId) || input.pacienteId <= 0) {
    throw new Error("Selecione um paciente válido");
  }

  const codigo = await gerarCodigoAtendimento("URGENCIA");
  const criadoPorId = usuario.userId ? Number(usuario.userId) : null;

  const atendimento = await prisma.$transaction(async (tx) => {
    const novo = await tx.atendimento.create({
      data: {
        codigo,
        tipo: "URGENCIA",
        pacienteId: input.pacienteId,
        procedenciaId: input.procedenciaId || null,
        origem: input.origem || "rececao",
        prioridade: input.prioridade || "Urgente",
        estado: "AGUARDANDO",
        criadoPorId,
      },
    });

    await tx.atendimentoUrgencia.create({
      data: {
        atendimentoId: novo.id,
        pacienteId: input.pacienteId,
        bancoUrgenciaId: input.bancoUrgenciaId || null,
        queixaPrincipal: input.queixaPrincipal || null,
        criadoPorId,
      },
    });

    const ultimaPosicao = await tx.filaAtendimento.aggregate({
      where: { tipoFila: "URGENCIA", status: { in: ["EM_FILA", "CHAMADO"] } },
      _max: { posicao: true },
    });

    await tx.filaAtendimento.create({
      data: {
        atendimentoId: novo.id,
        tipoFila: "URGENCIA",
        posicao: (ultimaPosicao._max.posicao || 0) + 1,
        criadoPorId,
      },
    });

    const codigoSenha = await tx.senhaAtendimento.findFirst({
      where: { tipo: "URGENCIA" },
      orderBy: { emitidaEm: "desc" },
      select: { codigo: true },
    });

    let proximaSenha = 1;
    if (codigoSenha?.codigo) {
      const num = parseInt(codigoSenha.codigo.replace("U-", ""), 10);
      if (!isNaN(num)) proximaSenha = num + 1;
    }

    const senha = `U-${String(proximaSenha).padStart(3, "0")}`;
    await tx.senhaAtendimento.create({
      data: {
        codigo: senha,
        tipo: "URGENCIA",
        pacienteId: input.pacienteId,
        atendimentoId: novo.id,
        emitidaPorId: criadoPorId,
      },
    });

    return { ...novo, senha };
  });

  await registarHistorico({
    acao: "CRIACAO",
    entidade: "ATENDIMENTO",
    entidadeId: atendimento.id,
    descricao: `Atendimento de urgência iniciado (${codigo}) — senha ${atendimento.senha}`,
    pacienteId: input.pacienteId,
  });

  revalidatePath("/atendimento");
  revalidatePath("/atendimento/urgencias");
  return atendimento;
}

// ---------------------------------------------------------------------------
// Triagem — registar sinais vitais e classificação de risco
// ---------------------------------------------------------------------------

export async function registarTriagem(input: {
  atendimentoId: number;
  classificacaoId: number;
  sinaisVitais?: Record<string, string | number>;
  sintomas?: string;
  alergias?: string;
  historicoDoenca?: string;
  medicacao?: string;
  observacoes?: string;
}) {
  if (!Number.isInteger(input.atendimentoId) || !Number.isInteger(input.classificacaoId)) {
    throw new Error("Dados de triagem inválidos");
  }

  const atend = await prisma.atendimento.findUnique({
    where: { id: input.atendimentoId },
    include: { paciente: { select: { id: true, nome: true } } },
  });
  if (!atend) throw new Error("Atendimento não encontrado");

  const usuario = await autorizar("atendimento", "editar");
  const enfermeiroId = usuario.userId ? Number(usuario.userId) : null;

  await prisma.$transaction(async (tx) => {
    const triagemExistente = await tx.triagem.findUnique({
      where: { atendimentoId: input.atendimentoId },
      select: { id: true },
    });
    if (triagemExistente) throw new Error("Este atendimento já possui triagem registada");

    // Atualizar estado do atendimento
    await tx.atendimento.update({
      where: { id: input.atendimentoId },
      data: { estado: "EM_TRIAGEM" },
    });

    // Criar triagem
    await tx.triagem.create({
      data: {
        atendimentoId: input.atendimentoId,
        pacienteId: atend.pacienteId,
        classificacaoId: input.classificacaoId,
        enfermeiroId,
        sinaisVitaisJson: (input.sinaisVitais as object) || undefined,
        sintomas: input.sintomas || null,
        alergias: input.alergias || null,
        historicoDoenca: input.historicoDoenca || null,
        medicacao: input.medicacao || null,
        observacoes: input.observacoes || null,
      },
    });

    // Se for urgência, associar classificação
    if (atend.tipo === "URGENCIA") {
      await tx.atendimentoUrgencia.update({
        where: { atendimentoId: input.atendimentoId },
        data: { classificacaoId: input.classificacaoId },
      });
    }
  });

  await registarHistorico({
    acao: "TRIAGEM",
    entidade: "ATENDIMENTO",
    entidadeId: input.atendimentoId,
    descricao: `Triagem registada para ${atend.paciente.nome}`,
    pacienteId: atend.pacienteId,
  });

  revalidatePath("/atendimento");
  revalidatePath("/atendimento/urgencias");
}

// ---------------------------------------------------------------------------
// Fila — chamar próximo / atender
// ---------------------------------------------------------------------------

export async function chamarProximo(tipoFila: "CONSULTA" | "URGENCIA") {
  await autorizar("atendimento", "editar");

  const proximo = await prisma.filaAtendimento.findFirst({
    where: {
      tipoFila,
      status: "EM_FILA",
      atendimento: { estado: { in: ["AGUARDANDO", "EM_TRIAGEM"] } },
    },
    orderBy:
      tipoFila === "URGENCIA"
        ? [
            { atendimento: { urgencia: { classificacao: { nivel: "desc" } } } },
            { posicao: "asc" },
            { criadoEm: "asc" },
          ]
        : [{ posicao: "asc" }, { criadoEm: "asc" }],
    include: {
      atendimento: {
        include: {
          paciente: { select: { id: true, nome: true } },
          senha: { select: { codigo: true } },
        },
      },
    },
  });

  if (!proximo) return null;

  const usuario = await autorizar("atendimento", "editar");

  await prisma.$transaction(async (tx) => {
    await tx.filaAtendimento.update({
      where: { id: proximo.id },
      data: { status: "CHAMADO", chamadoEm: new Date() },
    });
    await tx.atendimento.update({
      where: { id: proximo.atendimentoId },
      data: { estado: "EM_ATENDIMENTO" },
    });
    await tx.senhaAtendimento.updateMany({
      where: { atendimentoId: proximo.atendimentoId },
      data: { status: "CHAMADA", chamadaEm: new Date() },
    });
  });

  await registarHistorico({
    acao: "CHAMADA",
    entidade: "ATENDIMENTO",
    entidadeId: proximo.atendimentoId,
    descricao: `${proximo.atendimento.paciente.nome} chamado para ${tipoFila === "CONSULTA" ? "consulta" : "urgência"}`,
    pacienteId: proximo.atendimento.pacienteId,
  });

  revalidatePath("/atendimento");
  revalidatePath("/atendimento/consultas");
  revalidatePath("/atendimento/urgencias");
  return proximo;
}

export async function listarFilaAtendimento(tipoFila?: "CONSULTA" | "URGENCIA") {
  await autorizar("atendimento", "ver");

  return prisma.filaAtendimento.findMany({
    where: {
      ...(tipoFila ? { tipoFila } : {}),
      status: { in: ["EM_FILA", "CHAMADO"] },
      atendimento: { estado: { in: ["AGUARDANDO", "EM_TRIAGEM", "EM_ATENDIMENTO"] } },
    },
    orderBy: [{ tipoFila: "asc" }, { posicao: "asc" }, { criadoEm: "asc" }],
    include: {
      atendimento: {
        select: {
          id: true,
          codigo: true,
          tipo: true,
          estado: true,
          prioridade: true,
          paciente: { select: { id: true, nome: true, numeroProcesso: true } },
          especialidade: { select: { nome: true } },
          senha: { select: { codigo: true, status: true, chamadaEm: true } },
          urgencia: { select: { classificacao: { select: { nome: true, cor: true, nivel: true } } } },
        },
      },
    },
  });
}

export async function repetirChamada(atendimentoId: number) {
  await autorizar("atendimento", "editar");

  const fila = await prisma.filaAtendimento.findFirst({
    where: { atendimentoId, status: "CHAMADO" },
    include: { atendimento: { include: { paciente: { select: { id: true, nome: true } } } } },
  });
  if (!fila) throw new Error("Não existe uma chamada ativa para este paciente");

  await prisma.$transaction([
    prisma.filaAtendimento.update({ where: { id: fila.id }, data: { chamadoEm: new Date() } }),
    prisma.senhaAtendimento.updateMany({
      where: { atendimentoId },
      data: { status: "CHAMADA", chamadaEm: new Date() },
    }),
  ]);

  await registarHistorico({
    acao: "REPETIR_CHAMADA",
    entidade: "ATENDIMENTO",
    entidadeId: atendimentoId,
    descricao: `Chamada repetida para ${fila.atendimento.paciente.nome}`,
    pacienteId: fila.atendimento.pacienteId,
  });

  revalidatePath("/atendimento/fila");
  revalidatePath("/atendimento/consultas");
  revalidatePath("/atendimento/urgencias");
}

export async function devolverParaFila(atendimentoId: number) {
  await autorizar("atendimento", "editar");

  const fila = await prisma.filaAtendimento.findFirst({
    where: { atendimentoId, status: "CHAMADO" },
    include: { atendimento: { include: { paciente: { select: { id: true, nome: true } } } } },
  });
  if (!fila) throw new Error("Este paciente não possui uma chamada ativa");

  await prisma.$transaction([
    prisma.filaAtendimento.update({
      where: { id: fila.id },
      data: { status: "EM_FILA", chamadoEm: null },
    }),
    prisma.atendimento.update({
      where: { id: atendimentoId },
      data: { estado: fila.atendimento.tipo === "URGENCIA" ? "EM_TRIAGEM" : "AGUARDANDO" },
    }),
    prisma.senhaAtendimento.updateMany({
      where: { atendimentoId },
      data: { status: "EM_ESPERA", chamadaEm: null },
    }),
  ]);

  await registarHistorico({
    acao: "RETORNO_FILA",
    entidade: "ATENDIMENTO",
    entidadeId: atendimentoId,
    descricao: `${fila.atendimento.paciente.nome} devolvido à fila de espera`,
    pacienteId: fila.atendimento.pacienteId,
  });

  revalidatePath("/atendimento/fila");
  revalidatePath("/atendimento/consultas");
  revalidatePath("/atendimento/urgencias");
}

// ---------------------------------------------------------------------------
// Consulta — concluir com diagnóstico/prescrição
// ---------------------------------------------------------------------------

export async function concluirConsulta(input: {
  atendimentoId: number;
  diagnostico?: string;
  prescricao?: string;
  sinaisSintomas?: string;
  observacoes?: string;
  encaminharDestino?: string;
  encaminharMotivo?: string;
}) {
  const usuario = await autorizar("atendimento", "editar");
  const medicoId = usuario.userId ? Number(usuario.userId) : null;

  const atend = await prisma.atendimento.findUnique({
    where: { id: input.atendimentoId },
    include: {
      paciente: { select: { id: true, nome: true } },
      consulta: { select: { iniciadoEm: true } },
    },
  });
  if (!atend) throw new Error("Atendimento não encontrado");

  await prisma.$transaction(async (tx) => {
    await tx.atendimentoConsulta.update({
      where: { atendimentoId: input.atendimentoId },
      data: {
        diagnostico: input.diagnostico || null,
        prescricao: input.prescricao || null,
        sinaisSintomas: input.sinaisSintomas || null,
        observacoes: input.observacoes || null,
        medicoId,
        iniciadoEm: atend.consulta?.iniciadoEm || new Date(),
        concluidoEm: new Date(),
      },
    });

    await tx.atendimento.update({
      where: { id: input.atendimentoId },
      data: {
        estado: input.encaminharDestino ? "ENCAMINHADO" : "CONCLUIDO",
      },
    });

    await tx.filaAtendimento.updateMany({
      where: { atendimentoId: input.atendimentoId },
      data: { status: "CONCLUIDO", atendidoEm: new Date() },
    });

    await tx.senhaAtendimento.updateMany({
      where: { atendimentoId: input.atendimentoId },
      data: { status: "CONCLUIDA" },
    });

    // Encaminhamento, se requisitado
    if (input.encaminharDestino && input.encaminharMotivo) {
      await tx.encaminhamento.create({
        data: {
          atendimentoId: input.atendimentoId,
          pacienteId: atend.pacienteId,
          origemTipo: "CONSULTA",
          destino: input.encaminharDestino,
          tipoDestino: "interno",
          motivo: input.encaminharMotivo,
        },
      });
    }
  });

  await registarHistorico({
    acao: "CONCLUSAO",
    entidade: "ATENDIMENTO",
    entidadeId: input.atendimentoId,
    descricao: `Consulta de ${atend.paciente.nome} concluída`,
    pacienteId: atend.pacienteId,
  });

  revalidatePath("/atendimento");
  revalidatePath("/atendimento/consultas");
}

// ---------------------------------------------------------------------------
// Urgência — concluir com alta/internamento/transferência
// ---------------------------------------------------------------------------

export async function concluirUrgencia(input: {
  atendimentoId: number;
  diagnostico?: string;
  conduta?: string;
  evolucao?: string;
  altaTipo?: string;
  altaJustificativa?: string;
}) {
  const usuario = await autorizar("atendimento", "editar");
  const medicoIdUrgencia = usuario.userId ? Number(usuario.userId) : null;

  const atend = await prisma.atendimento.findUnique({
    where: { id: input.atendimentoId },
    include: { paciente: { select: { id: true, nome: true } } },
  });
  if (!atend) throw new Error("Atendimento não encontrado");

  await prisma.$transaction(async (tx) => {
    await tx.atendimentoUrgencia.update({
      where: { atendimentoId: input.atendimentoId },
      data: {
        diagnostico: input.diagnostico || null,
        conduta: input.conduta || null,
        evolucao: input.evolucao || null,
        altaTipo: input.altaTipo || "alta",
        altaJustificativa: input.altaJustificativa || null,
        medicoId: medicoIdUrgencia,
        concluidoEm: new Date(),
      },
    });

    await tx.atendimento.update({
      where: { id: input.atendimentoId },
      data: { estado: "CONCLUIDO" },
    });

    await tx.filaAtendimento.updateMany({
      where: { atendimentoId: input.atendimentoId },
      data: { status: "CONCLUIDO", atendidoEm: new Date() },
    });

    await tx.senhaAtendimento.updateMany({
      where: { atendimentoId: input.atendimentoId },
      data: { status: "CONCLUIDA" },
    });
  });

  await registarHistorico({
    acao: "CONCLUSAO",
    entidade: "ATENDIMENTO",
    entidadeId: input.atendimentoId,
    descricao: `Urgência de ${atend.paciente.nome} concluída (${input.altaTipo || "alta"})`,
    pacienteId: atend.pacienteId,
  });

  revalidatePath("/atendimento");
  revalidatePath("/atendimento/urgencias");
}

type PedidoExameInput = {
  tipoExameId: number;
  prioridade?: string;
  justificativa?: string;
};

type MedicamentoReceitaInput = {
  medicamento: string;
  dosagem?: string;
  via?: string;
  frequencia?: string;
  duracaoDias?: number;
  quantidade?: string;
  observacoes?: string;
};

export async function registarPedidosEReceita(input: {
  atendimentoId: number;
  pedidosExame?: PedidoExameInput[];
  medicamentos?: MedicamentoReceitaInput[];
  observacoesReceita?: string;
}) {
  const usuario = await autorizar("atendimento", "editar");
  const pedidos = (input.pedidosExame || []).filter((pedido) => Number.isInteger(pedido.tipoExameId) && pedido.tipoExameId > 0);
  const medicamentos = (input.medicamentos || []).filter((medicamento) => medicamento.medicamento.trim().length > 0);
  if (pedidos.length === 0 && medicamentos.length === 0) return null;

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: input.atendimentoId },
    select: { id: true, pacienteId: true },
  });
  if (!atendimento) throw new Error("Atendimento não encontrado");

  if (pedidos.length > 0) {
    const tiposValidos = await prisma.tipoExame.count({ where: { id: { in: pedidos.map((pedido) => pedido.tipoExameId) }, ativo: true } });
    if (tiposValidos !== new Set(pedidos.map((pedido) => pedido.tipoExameId)).size) throw new Error("Um dos tipos de exame selecionados não está disponível");
  }

  const criadoPorId = usuario.userId ? Number(usuario.userId) : null;
  await prisma.$transaction(async (tx) => {
    if (pedidos.length > 0) {
      await tx.pedidoExame.createMany({
        data: pedidos.map((pedido) => ({
          atendimentoId: atendimento.id,
          pacienteId: atendimento.pacienteId,
          tipoExameId: pedido.tipoExameId,
          prioridade: pedido.prioridade || "Normal",
          justificativa: pedido.justificativa?.trim() || null,
          criadoPorId,
        })),
      });
    }
    if (medicamentos.length > 0) {
      await tx.receita.create({
        data: {
          atendimentoId: atendimento.id,
          pacienteId: atendimento.pacienteId,
          observacoes: input.observacoesReceita?.trim() || null,
          criadoPorId,
          medicamentos: {
            create: medicamentos.map((medicamento, ordem) => ({
              medicamento: medicamento.medicamento.trim(),
              dosagem: medicamento.dosagem?.trim() || null,
              via: medicamento.via?.trim() || null,
              frequencia: medicamento.frequencia?.trim() || null,
              duracaoDias: medicamento.duracaoDias || null,
              quantidade: medicamento.quantidade?.trim() || null,
              observacoes: medicamento.observacoes?.trim() || null,
              ordem,
            })),
          },
        },
      });
    }
  });

  await registarHistorico({
    acao: "PRESCRICAO",
    entidade: "ATENDIMENTO",
    entidadeId: atendimento.id,
    descricao: `${pedidos.length} pedido(s) de exame e ${medicamentos.length} medicamento(s) registados`,
    pacienteId: atendimento.pacienteId,
  });
  revalidatePath("/atendimento/consultas");
  revalidatePath("/atendimento/urgencias");
  return { pedidos: pedidos.length, medicamentos: medicamentos.length };
}

// ---------------------------------------------------------------------------
// Encaminhamentos
// ---------------------------------------------------------------------------

export async function listarEncaminhamentos(estado?: string, page = 1, limit = 20) {
  await autorizar("atendimento", "ver");
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = {};
  if (estado) where.estado = estado;

  const [data, total] = await Promise.all([
    prisma.encaminhamento.findMany({
      where,
      skip,
      take: limit,
      orderBy: { criadoEm: "desc" },
      include: {
        paciente: { select: { id: true, nome: true, numeroProcesso: true } },
        atendimento: { select: { id: true, codigo: true, tipo: true } },
        criadoPor: { select: { id: true, nome: true } },
      },
    }),
    prisma.encaminhamento.count({ where }),
  ]);

  return { data, total, pages: Math.ceil(total / limit), currentPage: page };
}

export async function criarEncaminhamento(input: {
  atendimentoId: number;
  pacienteId: number;
  origemTipo?: string;
  destino: string;
  tipoDestino?: string;
  motivo: string;
  prioridade?: string;
}) {
  await autorizar("atendimento", "criar");

  const enc = await prisma.encaminhamento.create({
    data: {
      atendimentoId: input.atendimentoId,
      pacienteId: input.pacienteId,
      origemTipo: input.origemTipo || "CONSULTA",
      destino: input.destino,
      tipoDestino: input.tipoDestino || "interno",
      motivo: input.motivo,
      prioridade: input.prioridade || "Normal",
    },
  });

  await prisma.atendimento.update({
    where: { id: input.atendimentoId },
    data: { estado: "ENCAMINHADO" },
  });

  await registarHistorico({
    acao: "ENCAMINHAMENTO",
    entidade: "ENCAMINHAMENTO",
    entidadeId: enc.id,
    descricao: `Paciente encaminhado para ${input.destino}: ${input.motivo}`,
    pacienteId: input.pacienteId,
  });

  revalidatePath("/atendimento/encaminhamentos");
  return enc;
}

export async function atualizarEstadoEncaminhamento(id: number, estado: string) {
  await autorizar("atendimento", "editar");
  const enc = await prisma.encaminhamento.update({
    where: { id },
    data: {
      estado,
      aceiteEm: estado === "ACEITE" ? new Date() : undefined,
      concluidoEm: estado === "CONCLUIDO" ? new Date() : undefined,
    },
  });
  revalidatePath("/atendimento/encaminhamentos");
  return enc;
}

// ---------------------------------------------------------------------------
// Dashboard — indicadores do dia
// ---------------------------------------------------------------------------

export async function obterDashboardAtendimento(data?: string) {
  await autorizar("atendimento", "ver");

  const dia = data || new Date().toISOString().slice(0, 10);
  const inicio = new Date(`${dia}T00:00:00.000Z`);
  const fim = new Date(`${dia}T23:59:59.999Z`);

  const whereDia = { criadoEm: { gte: inicio, lte: fim } };

  const [total, consultas, urgencias, aguardando, emAtendimento, concluidos, porEstado, porBanco, tempoEspera] =
    await Promise.all([
      prisma.atendimento.count({ where: whereDia }),
      prisma.atendimento.count({ where: { ...whereDia, tipo: "CONSULTA" } }),
      prisma.atendimento.count({ where: { ...whereDia, tipo: "URGENCIA" } }),
      prisma.atendimento.count({ where: { ...whereDia, estado: { in: ["AGUARDANDO", "EM_TRIAGEM"] } } }),
      prisma.atendimento.count({ where: { ...whereDia, estado: "EM_ATENDIMENTO" } }),
      prisma.atendimento.count({ where: { ...whereDia, estado: "CONCLUIDO" } }),
      prisma.atendimento.groupBy({
        by: ["estado"],
        where: whereDia,
        _count: true,
      }),
      prisma.atendimentoUrgencia.groupBy({
        by: ["bancoUrgenciaId"],
        where: { criadoEm: { gte: inicio, lte: fim } },
        _count: true,
      }),
      prisma.atendimento.findMany({
        where: { ...whereDia },
        select: { criadoEm: true, atualizadoEm: true, estado: true },
      }),
    ]);

  // Tempo médio de espera (dos concluídos/em atendimento)
  let tempoMedioMin = 0;
  const concluidosComTempo = tempoEspera.filter(
    (a) => a.estado === "CONCLUIDO" && a.atualizadoEm > a.criadoEm
  );
  if (concluidosComTempo.length > 0) {
    const soma = concluidosComTempo.reduce(
      (acc, a) => acc + (a.atualizadoEm.getTime() - a.criadoEm.getTime()),
      0
    );
    tempoMedioMin = Math.round(soma / concluidosComTempo.length / 60000);
  }

  return {
    data: dia,
    total,
    consultas,
    urgencias,
    aguardando,
    emAtendimento,
    concluidos,
    porEstado,
    porBanco,
    tempoMedioEsperaMin: tempoMedioMin,
  };
}

// ---------------------------------------------------------------------------
// Relatórios
// ---------------------------------------------------------------------------

export async function obterRelatorioAtendimento(
  inicio: string,
  fim: string
) {
  await autorizar("atendimento", "ver");

  const inicioDate = new Date(`${inicio}T00:00:00.000Z`);
  const fimDate = new Date(`${fim}T23:59:59.999Z`);
  const where = { criadoEm: { gte: inicioDate, lte: fimDate } };

  const [total, consultas, urgencias, porEstado, porEspecialidade, porBanco, porDia] =
    await Promise.all([
      prisma.atendimento.count({ where }),
      prisma.atendimento.count({ where: { ...where, tipo: "CONSULTA" } }),
      prisma.atendimento.count({ where: { ...where, tipo: "URGENCIA" } }),
      prisma.atendimento.groupBy({ by: ["estado"], where, _count: true }),
      prisma.atendimentoConsulta.groupBy({
        by: ["especialidadeId"],
        where: { criadoEm: { gte: inicioDate, lte: fimDate } },
        _count: true,
      }),
      prisma.atendimentoUrgencia.groupBy({
        by: ["bancoUrgenciaId"],
        where: { criadoEm: { gte: inicioDate, lte: fimDate } },
        _count: true,
      }),
      prisma.atendimento.findMany({
        where,
        select: { criadoEm: true, tipo: true },
      }),
    ]);

  // Agregar por dia
  const porDiaObj: Record<string, { total: number; consultas: number; urgencias: number }> = {};
  porDia.forEach((a) => {
    const dia = a.criadoEm.toISOString().slice(0, 10);
    if (!porDiaObj[dia]) porDiaObj[dia] = { total: 0, consultas: 0, urgencias: 0 };
    porDiaObj[dia].total++;
    if (a.tipo === "CONSULTA") porDiaObj[dia].consultas++;
    else porDiaObj[dia].urgencias++;
  });

  return {
    periodo: { inicio, fim },
    total,
    consultas,
    urgencias,
    porEstado,
    porEspecialidade,
    porBanco,
    porDia: porDiaObj,
  };
}
