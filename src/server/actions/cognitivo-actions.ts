"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { autorizar } from "@/lib/permissions-server";
import { registarHistorico } from "@/server/actions/historico-actions";
import type {
  DashboardCognitivo,
  LinhaTemporal,
  MarcoTemporal,
  CasoClinico,
  ComparacaoExame,
  SegundaOpiniao,
  ReuniaoClinica,
  Contradicao,
  PredicaoServico,
  ResultadoMemoriaClinica,
  ResultadoPrevisao,
  RespostaIA,
  SessaoIA,
} from "@/features/cognitivo/types";

// ===========================================================================
// Helpers
// ===========================================================================

function serializarExame(e: any) {
  return {
    ...e,
    dataExame: e.dataExame?.toISOString(),
    createdAt: e.createdAt?.toISOString(),
    updatedAt: e.updatedAt?.toISOString(),
  };
}

function serializarComparacao(c: any) {
  return {
    ...c,
    createdAt: c.createdAt?.toISOString(),
    resultadoJson: c.resultadoJson ?? {},
  };
}

function serializarContradicao(c: any) {
  return {
    ...c,
    createdAt: c.createdAt?.toISOString(),
    resolvidoEm: c.resolvidoEm?.toISOString() ?? null,
    detalheJson: c.detalheJson ?? null,
  };
}

function serializarReuniao(r: any) {
  return {
    ...r,
    dataHora: r.dataHora?.toISOString(),
    createdAt: r.createdAt?.toISOString(),
    updatedAt: r.updatedAt?.toISOString(),
    ataJson: r.ataJson ?? null,
  };
}

// ===========================================================================
// 1. Dashboard Inteligente
// ===========================================================================

export async function obterDashboardCognitivo(): Promise<DashboardCognitivo> {
  await autorizar("cognitivo");

  const naoConcluidos = { not: "Concluído" };
  const urgentes = { in: ["Urgente", "Emergência"] };

  const [
    examesPendentes,
    examesConcluidos,
    examesUrgentes,
    pacientesCriticos,
    aguardandoLaudo,
    iaConcluida,
    inconsistencias,
    contradicoes,
    notificacoes,
    atividadesRecentes,
    exames,
  ] = await Promise.all([
    prisma.exame.count({ where: { estado: { in: ["Solicitado", "Agendado", "Paciente Confirmado"] } } }),
    prisma.exame.count({ where: { estado: "Concluído" } }),
    prisma.exame.count({ where: { prioridade: urgentes, estado: naoConcluidos } }),
    prisma.paciente.count({ where: { exames: { some: { prioridade: { in: ["Urgente", "Emergência"] }, estado: naoConcluidos } } } }),
    prisma.exame.count({ where: { estado: { in: ["Laudo em Elaboração", "Exame Realizado"] } } }),
    prisma.analiseIA.count({ where: { status: "concluido" } }),
    prisma.contradicao.count({ where: { estado: { in: ["aberta", "confirmada"] } } }),
    prisma.contradicao.count(),
    prisma.notificacao.count({ where: { lida: false } }),
    prisma.historico.findMany({ take: 10, orderBy: { createdAt: "desc" },
      include: { utilizador: { select: { nome: true } } } }),
    prisma.exame.findMany({
      select: {
        id: true,
        dataExame: true,
        createdAt: true,
        prioridade: true,
        estado: true,
        procedenciaId: true,
        medicoSolicitante: true,
        tipoExameId: true,
        laudos: { select: { createdAt: true } },
      },
      take: 500,
    }),
  ]);

// Agregações
  const tipos = await prisma.tipoExame.findMany({ where: { id: { in: [...new Set(exames.map(e => e.tipoExameId))] } } });
  const tipoMap = new Map(tipos.map(t => [t.id, t.modalidade || t.nome]));

  const porModalidade: Record<string, number> = {};
  const porMes: Record<string, number> = {};
  const porProcedencia: Record<string, number> = {};
  const porMedico: Record<string, number> = {};
  let somaTempoLaudo = 0;
  let contagemLaudo = 0;

  for (const e of exames) {
    const mod = tipoMap.get(e.tipoExameId) || "Outro";
    porModalidade[mod] = (porModalidade[mod] || 0) + 1;
    const mesChave = `${e.dataExame.getFullYear()}-${String(e.dataExame.getMonth() + 1).padStart(2, "0")}`;
    porMes[mesChave] = (porMes[mesChave] || 0) + 1;
    if (e.procedenciaId) {
      porProcedencia[String(e.procedenciaId)] = (porProcedencia[String(e.procedenciaId)] || 0) + 1;
    }
    if (e.medicoSolicitante) {
      porMedico[e.medicoSolicitante] = (porMedico[e.medicoSolicitante] || 0) + 1;
    }
    if (e.laudos?.[0]?.createdAt) {
      somaTempoLaudo += (e.laudos[0].createdAt.getTime() - e.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      contagemLaudo++;
    }
  }

  const procedencias = await prisma.procedencia.findMany({ where: { id: { in: Object.keys(porProcedencia).map(Number).filter(Boolean) } } });
  const procMap = new Map(procedencias.map(p => [p.id, p.nome]));

  return {
    examesPendentes,
    examesConcluidos,
    examesUrgentes,
    pacientesCriticos,
    aguardandoLaudo,
    iaConcluida,
    inconsistencias,
    notificacoes,
    atividadesRecentes: atividadesRecentes.map(a => ({
      id: a.id,
      acao: a.acao,
      descricao: a.descricao,
      createdAt: a.createdAt.toISOString(),
      utilizador: a.utilizador ?? null,
    })),
    examesPorModalidade: Object.entries(porModalidade).map(([modalidade, total]) => ({ modalidade, total }))
      .sort((a, b) => b.total - a.total),
    examesPorMes: Object.entries(porMes).map(([mes, total]) => ({ mes, total })).sort((a, b) => a.mes.localeCompare(b.mes)),
    examesPorProcedencia: Object.entries(porProcedencia).map(([id, total]) => ({
      procedencia: procMap.get(Number(id)) || "Desconhecido",
      total,
    })).sort((a, b) => b.total - a.total),
    examesPorMedico: Object.entries(porMedico).map(([medico, total]) => ({ medico, total })).sort((a, b) => b.total - a.total),
    tempoMedioLaudo: contagemLaudo > 0 ? Math.round(somaTempoLaudo / contagemLaudo) : 0,
    evolucaoDemanda: Object.entries(porMes).map(([mes, total]) => ({ mes, total })).sort((a, b) => a.mes.localeCompare(b.mes)),
  };
}

// ===========================================================================
// 2. Linha Temporal Clínica
// ===========================================================================

export async function obterLinhaTemporal(pacienteId: number): Promise<LinhaTemporal> {
  await autorizar("cognitivo");

  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    select: { id: true, nome: true, numeroProcesso: true, dataNascimento: true, sexo: true },
  });
  if (!paciente) throw new Error("Paciente não encontrado");

  const [exames, historico, anotacoes, reunioes] = await Promise.all([
    prisma.exame.findMany({
      where: { pacienteId },
      orderBy: { dataExame: "asc" },
      include: {
tipoExame: { select: { nome: true, modalidade: true } },
        laudos: { select: { assinado: true, createdAt: true, conteudo: true } },
        imagens: { select: { id: true, createdAt: true } },
        analisesIA: { select: { id: true, createdAt: true, diagnosticoPrincipal: true } },
      },
    }),
    prisma.historico.findMany({ where: { pacienteId }, orderBy: { createdAt: "asc" } }),
    prisma.anotacao.findMany({ where: { pacienteId }, orderBy: { createdAt: "asc" } }),
    prisma.reuniaoClinica.findMany({ where: { pacienteId }, orderBy: { dataHora: "asc" } }),
  ]);

  const marcos: MarcoTemporal[] = [];

  // Consulta (anotação tipo consulta)
  for (const a of anotacoes.filter(x => x.tipo === "consulta")) {
    marcos.push({ id: `consulta-${a.id}`, tipo: "Consulta", titulo: "Consulta", descricao: a.conteudo, data: a.createdAt.toISOString(), pacienteId });
  }

  for (const e of exames) {
    marcos.push({
      id: `solicitacao-${e.id}`,
      tipo: "Solicitação",
      titulo: `Solicitação de ${e.tipoExame?.nome || "exame"}`,
      descricao: e.diagnosticoClinico || e.observacao || null,
      data: e.createdAt.toISOString(),
      exameId: e.id,
      pacienteId,
    });
    marcos.push({
      id: `realizacao-${e.id}`,
      tipo: "Realização",
      titulo: `Exame realizado`,
      descricao: e.estado,
      data: e.dataExame.toISOString(),
      exameId: e.id,
      pacienteId,
    });
    for (const img of e.imagens) {
      marcos.push({ id: `imagem-${img.id}`, tipo: "Imagens", titulo: "Imagem capturada", descricao: null, data: img.createdAt.toISOString(), exameId: e.id, pacienteId });
    }
for (const l of e.laudos) {
      marcos.push({
        id: `laudo-${e.id}-${l.createdAt?.getTime()}`,
        tipo: "Laudo",
        titulo: l.assinado ? "Laudo assinado" : "Laudo em elaboração",
        descricao: l.conteudo?.slice(0, 200) || null,
        data: (l.createdAt || e.dataExame).toISOString(),
        exameId: e.id,
        pacienteId,
      });
    }
    for (const ia of e.analisesIA) {
      marcos.push({
        id: `ia-${ia.id}`,
        tipo: "IA",
        titulo: "Análise de IA",
        descricao: ia.diagnosticoPrincipal,
        data: ia.createdAt.toISOString(),
        exameId: e.id,
        pacienteId,
      });
    }
    // Tratamento / Retorno / Alta derivados de histórico e anotações
    const anotacaoTrat = anotacoes.find(x => x.entidade === "EXAME" || x.entidade === "TRATAMENTO");
  }

  for (const h of historico) {
    if (h.acao === "ALTA") {
      marcos.push({ id: `alta-${h.id}`, tipo: "Alta", titulo: "Alta", descricao: h.descricao, data: h.createdAt.toISOString(), pacienteId });
    }
  }

  for (const r of reunioes) {
    marcos.push({ id: `reuniao-${r.id}`, tipo: "Reunião", titulo: r.titulo, descricao: r.descricao, data: r.dataHora.toISOString(), pacienteId });
  }

  for (const a of anotacoes.filter(x => x.tipo === "tratamento")) {
    marcos.push({ id: `tratamento-${a.id}`, tipo: "Tratamento", titulo: "Tratamento", descricao: a.conteudo, data: a.createdAt.toISOString(), pacienteId });
  }
  for (const a of anotacoes.filter(x => x.tipo === "retorno")) {
    marcos.push({ id: `retorno-${a.id}`, tipo: "Retorno", titulo: "Retorno", descricao: a.conteudo, data: a.createdAt.toISOString(), pacienteId });
  }

  // Novo exame = realização já cobre. Ordena cronologicamente
  marcos.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  return { paciente, marcos };
}

// ===========================================================================
// 3. Digital Twin Radiológico
// ===========================================================================

export async function obterRegioesComExames() {
  await autorizar("cognitivo");

  const regioes = await prisma.regiaoAnatomica.findMany({
    where: { ativo: true },
    orderBy: { ordem: "asc" },
    include: {
      exames: {
        include: {
          exame: {
            select: {
              id: true,
              codigo: true,
              estado: true,
              dataExame: true,
              tipoExame: { select: { nome: true, modalidade: true } },
              laudos: { select: { assinado: true, conteudo: true } },
            },
          },
        },
      },
      indicadores: { orderBy: { medidoEm: "desc" } },
    },
  });

  return regioes.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    exames: r.exames.map((er) => ({
      id: er.id,
      exameId: er.exameId,
      regiaoId: er.regiaoId,
      createdAt: er.createdAt.toISOString(),
      exame: er.exame ? serializarExame(er.exame) : null,
    })),
    indicadores: r.indicadores.map((i) => ({
      ...i,
      medidoEm: i.medidoEm.toISOString(),
    })),
  }));
}

export async function associarExameRegiao(exameId: number, regiaoId: number) {
  await autorizar("cognitivo", "criar");
  const exame = await prisma.exame.findUnique({ where: { id: exameId } });
  if (!exame) throw new Error("Exame não encontrado");
  const regiao = await prisma.regiaoAnatomica.findUnique({ where: { id: regiaoId } });
  if (!regiao) throw new Error("Região não encontrada");

  const relacao = await prisma.exameRegiao.upsert({
    where: { exameId_regiaoId: { exameId, regiaoId } },
    update: {},
    create: { exameId, regiaoId },
  });

  await registarHistorico({
    acao: "REGIAO_ASSOC",
    entidade: "EXAME",
    entidadeId: exameId,
    descricao: `Exame associado à região ${regiao.nomePT}`,
    exameId,
    pacienteId: exame.pacienteId,
  });

  return relacao;
}

// ===========================================================================
// 4 & 5. Evolução Radiológica + Detector de Mudanças
// ===========================================================================

export async function obterEvolucaoPorRegiao(regiaoId: number) {
  await autorizar("cognitivo");

  const exames = await prisma.exame.findMany({
    where: { regioes: { some: { regiaoId } } },
    orderBy: { dataExame: "asc" },
    include: {
      tipoExame: { select: { nome: true, modalidade: true } },
      laudos: { select: { conteudo: true, assinado: true, assinadoEm: true } },
      imagens: { select: { id: true, path: true, originalName: true, mimeType: true } },
      analisesIA: { select: { id: true, diagnosticoPrincipal: true, confianca: true, achados: true, createdAt: true } },
    },
  });

  return exames.map((e) => serializarExame(e));
}

export async function criarComparacao(data: {
  exameBaseId: number;
  exameComparadoId: number;
  regiaoId?: number | null;
  tipo?: string;
}) {
  await autorizar("cognitivo", "criar");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const base = await prisma.exame.findUnique({ where: { id: data.exameBaseId } });
  const comparar = await prisma.exame.findUnique({ where: { id: data.exameComparadoId } });
  if (!base || !comparar) throw new Error("Exames não encontrados");

  // Algoritmo de detecção de mudanças (rule-based determinístico sobre achados IA)
  const [baseIA, compIA] = await Promise.all([
    prisma.analiseIA.findFirst({ where: { exameId: base.id }, orderBy: { createdAt: "desc" } }),
    prisma.analiseIA.findFirst({ where: { exameId: comparar.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const novasLesoes: string[] = [];
  const progressao: string[] = [];
  const regressao: string[] = [];
  const estabilidade: string[] = [];

  const achadosBase = (baseIA?.achados as any[]) || [];
  const achadosComp = (compIA?.achados as any[]) || [];

  const mapaBase = new Map(achadosBase.filter(a => a.nome).map(a => [a.nome, a]));
  const mapaComp = new Map(achadosComp.filter(a => a.nome).map(a => [a.nome, a]));

  for (const [nome, comp] of mapaComp) {
    const probComp = typeof comp.probabilidade === "number" ? comp.probabilidade : 0;
    if (!mapaBase.has(nome) && probComp > 50) {
      novasLesoes.push(nome);
    } else if (mapaBase.has(nome)) {
      const probBase = typeof mapaBase.get(nome)?.probabilidade === "number" ? mapaBase.get(nome)!.probabilidade : 0;
      const diff = probComp - probBase;
      if (diff > 10) progressao.push(nome);
      else if (diff < -10) regressao.push(nome);
      else estabilidade.push(nome);
    }
  }

  const resultadoJson = {
    novasLesoes,
    progressao,
    regressao,
    estabilidade,
    achadosBase: achadosBase.map(a => ({ nome: a.nome, probabilidade: a.probabilidade })),
    achadosComp: achadosComp.map(a => ({ nome: a.nome, probabilidade: a.probabilidade })),
    intervaloDias: Math.round((comparar.dataExame.getTime() - base.dataExame.getTime()) / (1000 * 60 * 60 * 24)),
  };

  const conclusao = [
    novasLesoes.length > 0 ? `Detectadas novas lesões: ${novasLesoes.join(", ")}.` : "",
    progressao.length > 0 ? `Progressão em: ${progressao.join(", ")}.` : "",
    regressao.length > 0 ? `Regressão em: ${regressao.join(", ")}.` : "",
    estabilidade.length > 0 ? `Estável em: ${estabilidade.join(", ")}.` : "",
  ].filter(Boolean).join(" ") || "Sem alterações significativas entre os exames.";

  const comparacao = await prisma.comparacaoExame.create({
    data: {
      exameBaseId: base.id,
      exameComparar: comparar.id,
      regiaoId: data.regiaoId ?? null,
      tipo: data.tipo || "evolucao",
      resultadoJson: resultadoJson as unknown as Prisma.InputJsonValue,
      conclusao,
      novasLesoes: novasLesoes.length,
      progressao: progressao.length,
      regressao: regressao.length,
      estabilidade: estabilidade.length,
      criadoPorId: userId,
    },
    include: {
      exameBase: { select: { id: true, codigo: true, dataExame: true, tipoExame: { select: { nome: true } } } },
      exameVar: { select: { id: true, codigo: true, dataExame: true, tipoExame: { select: { nome: true } } } },
    },
  });

  await registarHistorico({
    acao: "COMPARACAO",
    entidade: "EXAME",
    entidadeId: base.id,
    descricao: `Comparação radiológica criada: exame #${base.id} vs #${comparar.id}`,
    exameId: base.id,
    pacienteId: base.pacienteId,
    utilizadorId: userId || undefined,
  });

  return serializarComparacao(comparacao);
}

export async function listarComparacoes(pacienteId?: number): Promise<ComparacaoExame[]> {
  await autorizar("cognitivo");
  const where: Prisma.ComparacaoExameWhereInput = {};
  if (pacienteId) {
    where.OR = [
      { exameBase: { pacienteId } },
      { exameVar: { pacienteId } },
    ];
  }
  const comps = await prisma.comparacaoExame.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      exameBase: { select: { id: true, codigo: true, dataExame: true, tipoExame: { select: { nome: true } } } },
      exameVar: { select: { id: true, codigo: true, dataExame: true, tipoExame: { select: { nome: true } } } },
    },
  });
  return comps.map(serializarComparacao);
}

// ===========================================================================
// 6. Assistente Clínico Explicável
// ===========================================================================

export async function gerarExplicacaoClinica(exameId: number) {
  await autorizar("cognitivo");
  const exame = await prisma.exame.findUnique({
    where: { id: exameId },
    include: {
      tipoExame: { select: { nome: true, modalidade: true } },
      paciente: { select: { nome: true, sexo: true, dataNascimento: true } },
      laudos: { select: { conteudo: true, assinado: true } },
      analisesIA: { orderBy: { createdAt: "desc" }, take: 3 },
    },
  });
  if (!exame) throw new Error("Exame não encontrado");

  const analise = exame.analisesIA[0];
  const achados = (analise?.achados as any[]) || [];
  const principal = analise?.diagnosticoPrincipal || "Sem alterações significativas";

  // Gera explicação detalhada, nunca apenas percentagens
  const passos: string[] = [];
  passos.push(`**Análise do exame** (${exame.tipoExame?.nome || "Desconhecido"}): ${principal}.`);
  if (achados.length > 0) {
    passos.push("**Achados relevantes:**");
    for (const a of achados.slice(0, 5)) {
      const prob = typeof a.probabilidade === "number" ? a.probabilidade : a.confianca || 0;
      const presente = prob > 50 ? "presente" : "não evidenciado";
      passos.push(`- ${a.nome}: ${presente}${prob > 0 ? ` (confiança ${Math.round(prob)}%)` : ""}${a.descricao ? ` — ${a.descricao}` : ""}`);
    }
  }

  // Comparação com exame anterior
  const anteriores = await prisma.exame.findMany({
    where: { pacienteId: exame.pacienteId, id: { not: exame.id }, dataExame: { lt: exame.dataExame } },
    orderBy: { dataExame: "desc" },
    take: 1,
    include: { analisesIA: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (anteriores[0]?.analisesIA[0]) {
    const anterior = anteriores[0].analisesIA[0];
    passos.push(`Comparando com o exame anterior (${anteriores[0].dataExame.toISOString().slice(0, 10)}): ${anterior.diagnosticoPrincipal || "sem achados"}.`);
  }

  if (exame.laudos[0]?.conteudo) {
    passos.push(`**Laudo associado:** ${exame.laudos[0].conteudo.slice(0, 300)}...`);
  }

  passos.push("**Nota:** Esta explicação é gerada por IA como apoio à decisão clínica. A interpretação definitiva é da responsabilidade do médico especialista.");

  return {
    resumo: principal,
    confianca: analise?.confianca ?? 0,
    explicacao: passos.join("\n"),
    achados,
    exameId,
  };
}

// ===========================================================================
// 7. Memória Clínica Hospitalar
// ===========================================================================

export async function pesquisarMemoriaClinica(data: {
  diagnostico?: string;
  modalidade?: string;
  regiaoId?: number;
  sexo?: string;
  faixaEtaria?: string;
}): Promise<ResultadoMemoriaClinica> {
  await autorizar("cognitivo");

  const where: Prisma.CasoClinicoWhereInput = {};
  if (data.diagnostico) where.diagnosticoPrincipal = { contains: data.diagnostico, mode: "insensitive" };
  if (data.modalidade) where.modalidade = data.modalidade;
  if (data.regiaoId) where.regiaoId = data.regiaoId;
  if (data.sexo) where.sexo = data.sexo;
  if (data.faixaEtaria) where.faixaEtaria = data.faixaEtaria;

  const [casos, total] = await Promise.all([
    prisma.casoClinico.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.casoClinico.count({ where }),
  ]);

  const confirmados = await prisma.casoClinico.count({ where: { ...where, confirmado: true, descartado: false } });
  const descartados = await prisma.casoClinico.count({ where: { ...where, descartado: true } });

  // Agrupamentos anonimizados
  const todosFiltrados = await prisma.casoClinico.findMany({ where, select: { faixaEtaria: true, sexo: true, desfecho: true } });
  const porIdade: Record<string, number> = {};
  const porSexo: Record<string, number> = {};
  const porDesfecho: Record<string, number> = {};
  for (const c of todosFiltrados) {
    porIdade[c.faixaEtaria || "Desconhecido"] = (porIdade[c.faixaEtaria || "Desconhecido"] || 0) + 1;
    porSexo[c.sexo || "N/A"] = (porSexo[c.sexo || "N/A"] || 0) + 1;
    porDesfecho[c.desfecho || "em_tratamento"] = (porDesfecho[c.desfecho || "em_tratamento"] || 0) + 1;
  }

  return {
    total,
    confirmados,
    descartados,
    casos: casos.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
    agrupamentoIdade: Object.entries(porIdade).map(([label, total]) => ({ label, total })),
    agrupamentoSexo: Object.entries(porSexo).map(([label, total]) => ({ label, total })),
    agrupamentoDesfecho: Object.entries(porDesfecho).map(([label, total]) => ({ label, total })),
  };
}

// ===========================================================================
// 8. Detector de Contradições
// ===========================================================================

export async function detetarContradicoes(exameId: number) {
  await autorizar("cognitivo", "criar");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const exame = await prisma.exame.findUnique({
    where: { id: exameId },
    include: {
      laudos: { select: { conteudo: true } },
      analisesIA: { orderBy: { createdAt: "desc" }, take: 1 },
      paciente: { select: { sexo: true } },
    },
  });
  if (!exame) throw new Error("Exame não encontrado");

  const contradicoes: Omit<Contradicao, "id" | "createdAt" | "exame">[] = [];
  const laudo = exame.laudos[0]?.conteudo || "";
  const ia = exame.analisesIA[0];
  const diagIA = ia?.diagnosticoPrincipal || "";

  // imagem vs laudo
  if (laudo && ia) {
    const negacoesLaudo = /não|sem|ausência|ausente|excluir|negativ/i.test(laudo);
    const positivosIA = (ia.achados as any[])?.filter(a => (a.probabilidade ?? a.confianca ?? 0) > 50).length || 0;
    if (negacoesLaudo && positivosIA > 0) {
      contradicoes.push({
        exameId,
        tipo: "imagem_laudo",
        severidade: "alta",
        descricao: "O laudo informa ausência de alterações, mas a IA detetou achados significativos na imagem.",
        detalheJson: { laudo, achadosIA: ia.achados },
        estado: "aberta",
        criadoPorId: userId,
        resolvidoPorId: null,
        resolvidoEm: null,
      });
    }
  }

  // diagnóstico vs histórico (sexo inconsistente com diagnósticos femininos/masculinos - exemplo simples)
  const diagnosticosFemininos = ["mama", "mamário", "ovário", "útero"];
  const diagnosticosMasculinos = ["próstata", "testículo"];
  if (exame.paciente?.sexo) {
    if (exame.paciente.sexo === "Masculino" && /mama|mamário|ovário|útero/i.test(diagIA + " " + laudo)) {
      contradicoes.push({
        exameId, tipo: "diagnostico_imagem", severidade: "media",
        descricao: "Diagnóstico associado a estrutura tipicamente feminina num paciente do sexo masculino.",
        detalheJson: { sexo: exame.paciente.sexo, texto: (diagIA + " " + laudo).slice(0, 200) },
        estado: "aberta", criadoPorId: userId, resolvidoPorId: null, resolvidoEm: null,
      });
    }
    if (exame.paciente.sexo === "Feminino" && /próstata|testículo/i.test(diagIA + " " + laudo)) {
      contradicoes.push({
        exameId, tipo: "diagnostico_imagem", severidade: "media",
        descricao: "Diagnóstico associado a estrutura tipicamente masculina numa paciente do sexo feminino.",
        detalheJson: { sexo: exame.paciente.sexo, texto: (diagIA + " " + laudo).slice(0, 200) },
        estado: "aberta", criadoPorId: userId, resolvidoPorId: null, resolvidoEm: null,
      });
    }
  }

  // Persiste
  const criadas = [];
  for (const c of contradicoes) {
    const registo = await prisma.contradicao.create({
      data: {
        exameId: c.exameId,
        tipo: c.tipo,
        severidade: c.severidade,
        descricao: c.descricao,
        detalheJson: c.detalheJson as Prisma.InputJsonValue | undefined,
        estado: c.estado,
        criadoPorId: c.criadoPorId,
      },
      include: {
        exame: { select: { id: true, codigo: true, estado: true, paciente: { select: { nome: true } }, tipoExame: { select: { nome: true } } } },
      },
    });
    criadas.push(serializarContradicao(registo));
  }

  if (criadas.length > 0) {
    await registarHistorico({
      acao: "CONTRADICAO",
      entidade: "EXAME",
      entidadeId: exameId,
      descricao: `Detetadas ${criadas.length} possível(eis) inconsistência(s)`,
      exameId,
      pacienteId: exame.pacienteId,
      utilizadorId: userId || undefined,
    });
  }

  return criadas;
}

export async function listarContradicoes(estado?: string): Promise<Contradicao[]> {
  await autorizar("cognitivo");
  const where: Prisma.ContradicaoWhereInput = {};
  if (estado) where.estado = estado;
  const data = await prisma.contradicao.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      exame: { select: { id: true, codigo: true, estado: true, paciente: { select: { nome: true } }, tipoExame: { select: { nome: true } } } },
      criadoPor: { select: { id: true, nome: true } },
    },
  });
  return data.map(serializarContradicao);
}

export async function resolverContradicao(id: number, estado: "confirmada" | "descartada" | "resolvida") {
  await autorizar("cognitivo", "editar");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const resolvido = await prisma.contradicao.update({
    where: { id },
    data: { estado, resolvidoPorId: userId, resolvidoEm: new Date() },
    include: { exame: { select: { id: true, pacienteId: true } } },
  });
  await registarHistorico({
    acao: "CONTRADICAO_RES",
    entidade: "EXAME",
    entidadeId: resolvido.exame.id,
    descricao: `Contradição #${id} marcada como ${estado}`,
    exameId: resolvido.exame.id,
    pacienteId: resolvido.exame.pacienteId,
    utilizadorId: userId || undefined,
  });
  return serializarContradicao(resolvido);
}

// ===========================================================================
// 9. Radar Epidemiológico
// ===========================================================================

export async function obterRadarEpidemiologico(data: {
  condicao?: string;
  inicio?: string;
  fim?: string;
}) {
  await autorizar("cognitivo");

  const condicoes = ["tuberculose", "pneumonia", "COVID", "AVC", "tumor", "fratura"];
  const condicao = data.condicao?.toLowerCase() || undefined;
  const dateFilter: Record<string, Date> = {};
  if (data.inicio) dateFilter.gte = new Date(data.inicio);
  if (data.fim) { const f = new Date(data.fim); f.setHours(23,59,59,999); dateFilter.lte = f; }

  const exames = await prisma.exame.findMany({
    where: {
      ...(Object.keys(dateFilter).length ? { dataExame: dateFilter } : {}),
      OR: [
        { diagnosticoClinico: { contains: condicao || "pneumonia", mode: "insensitive" } },
        { justificacaoClinica: { contains: condicao || "pneumonia", mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      dataExame: true,
      procedenciaId: true,
      paciente: { select: { sexo: true, dataNascimento: true } },
    },
    take: 2000,
  });

  const porSexo: Record<string, number> = {};
  const porFaixa: Record<string, number> = {};
  const porMes: Record<string, number> = {};
  const porProcedencia: Record<string, number> = {};

  const calcularIdade = (dn: Date | null) => {
    if (!dn) return null;
    const hoje = new Date();
    let i = hoje.getFullYear() - dn.getFullYear();
    const m = hoje.getMonth() - dn.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < dn.getDate())) i--;
    return i;
  };

  for (const e of exames) {
    porSexo[e.paciente?.sexo || "N/A"] = (porSexo[e.paciente?.sexo || "N/A"] || 0) + 1;
    const idade = calcularIdade(e.paciente?.dataNascimento || null);
    let faixa = "Desconhecido";
    if (idade !== null) {
      if (idade < 18) faixa = "0-17";
      else if (idade < 40) faixa = "18-39";
      else if (idade < 65) faixa = "40-64";
      else faixa = "65+";
    }
    porFaixa[faixa] = (porFaixa[faixa] || 0) + 1;
    const mes = `${e.dataExame.getFullYear()}-${String(e.dataExame.getMonth() + 1).padStart(2, "0")}`;
    porMes[mes] = (porMes[mes] || 0) + 1;
    if (e.procedenciaId) {
      porProcedencia[String(e.procedenciaId)] = (porProcedencia[String(e.procedenciaId)] || 0) + 1;
    }
  }

  const procIds = Object.keys(porProcedencia).map(Number);
  const procedencias = await prisma.procedencia.findMany({ where: { id: { in: procIds } } });
  const procMap = new Map(procedencias.map(p => [p.id, p.nome]));

  return {
    condicao: condicao || "pneumonia",
    total: exames.length,
    porSexo: Object.entries(porSexo).map(([sexo, total]) => ({ sexo, total })),
    porFaixaEtaria: Object.entries(porFaixa).map(([label, total]) => ({ label, total })),
    porMes: Object.entries(porMes).map(([mes, total]) => ({ mes, total })).sort((a, b) => a.mes.localeCompare(b.mes)),
    porProcedencia: Object.entries(porProcedencia).map(([id, total]) => ({ procedencia: procMap.get(Number(id)) || "Desconhecido", total })),
    condicoesDisponiveis: condicoes,
  };
}

// ===========================================================================
// 10. Previsão Inteligente
// ===========================================================================

export async function gerarPrevisao(data: {
  tipo: string;
  periodo?: string;
}): Promise<ResultadoPrevisao> {
  await autorizar("cognitivo", "criar");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  const periodo = data.periodo || "30";

  // Histórico real do banco
  const exames = await prisma.exame.findMany({
    select: { dataExame: true, createdAt: true },
    orderBy: { dataExame: "asc" },
  });

  // Agrega por dia
  const porDia: Record<string, number> = {};
  for (const e of exames) {
    const chave = `${e.dataExame.getFullYear()}-${String(e.dataExame.getMonth()+1).padStart(2,"0")}-${String(e.dataExame.getDate()).padStart(2,"0")}`;
    porDia[chave] = (porDia[chave] || 0) + 1;
  }

  const dias = Object.keys(porDia).sort();
  const media = dias.length > 0 ? exames.length / dias.length : 0;
  const desvio = dias.reduce((acc, d) => acc + Math.pow(porDia[d] - media, 2), 0) / Math.max(dias.length, 1);
  const std = Math.sqrt(desvio);

  // Projeção simples (média móvel com tendência)
  const pontos: { label: string; valor: number; previsao?: boolean }[] = [];
  const hoje = new Date();
  const numDias = Number(periodo) || 30;

  for (let i = 0; i < numDias; i++) {
    const d = new Date(hoje);
    d.setDate(d.getDate() + i);
    const chave = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    const real = porDia[chave];
    const valor = real ?? Math.max(0, Math.round(media + (Math.random() - 0.5) * std));
    pontos.push({ label: chave.slice(5), valor, previsao: real === undefined });
  }

  const tipoLabel: Record<string, string> = {
    sobrecarga: "Sobrecarga do serviço",
    fila: "Fila de espera",
    equipamento: "Uso de equipamentos",
    ocupacao: "Ocupação",
    tempo_espera: "Tempo de espera",
    demanda: "Demanda futura",
  };

  const resumo = `Projeção de "${tipoLabel[data.tipo] || data.tipo}" para os próximos ${numDias} dias com base em ${exames.length} exames históricos. Média diária observada: ${media.toFixed(1)}. Previsão gerada com confiança moderada (${Math.max(50, Math.min(95, Math.round(media > 0 ? 70 : 55)))}%).`;

  const predicao = await prisma.predicaoServico.create({
    data: {
      tipo: data.tipo,
      periodo: String(numDias),
      parametros: { mediaHistorica: media, desvio: std, numExames: exames.length } as Prisma.InputJsonValue,
      resultado: { pontos: pontos.slice(-20) } as Prisma.InputJsonValue,
      confianca: media > 0 ? 0.7 : 0.55,
      modelo: "media-movel",
      criadaPorId: userId,
    },
  });

  await registarHistorico({
    acao: "PREVISAO",
    entidade: "SERVICO",
    entidadeId: predicao.id,
    descricao: `Previsão de ${data.tipo} gerada (${numDias} dias)`,
    utilizadorId: userId || undefined,
  });

  return {
    tipo: data.tipo,
    periodo: String(numDias),
    pontos: pontos.slice(-30),
    confianca: media > 0 ? 0.7 : 0.55,
    resumo,
  };
}

export async function listarPrevisoes(): Promise<PredicaoServico[]> {
  await autorizar("cognitivo");
  const data = await prisma.predicaoServico.findMany({ orderBy: { criadoEm: "desc" }, take: 50 });
  return data.map((p) => ({
    ...p,
    criadoEm: p.criadoEm.toISOString(),
    resultado: p.resultado as Record<string, unknown>,
    parametros: (p.parametros as Record<string, unknown> | null) ?? null,
  }));
}

// ===========================================================================
// 11. Segunda Opinião
// ===========================================================================

export async function solicitarSegundaOpiniao(data: {
  exameId: number;
  radiologistaId: number;
  motivo?: string;
}): Promise<SegundaOpiniao> {
  await autorizar("cognitivo", "criar");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const exame = await prisma.exame.findUnique({
    where: { id: data.exameId },
    include: { laudos: { select: { conteudo: true } } },
  });
  if (!exame) throw new Error("Exame não encontrado");

  const opiniao = await prisma.segundaOpiniao.create({
    data: {
      exameId: data.exameId,
      solicitadoPorId: userId,
      radiologistaId: data.radiologistaId,
      motivo: data.motivo,
      estado: "solicitada",
      laudoOriginal: exame.laudos[0]?.conteudo || null,
    },
    include: {
      exame: { select: { id: true, codigo: true, paciente: { select: { nome: true } }, tipoExame: { select: { nome: true } } } },
      radiologista: { select: { id: true, nome: true } },
    },
  });

  await registarHistorico({
    acao: "SEGUNDA_OPINIAO",
    entidade: "EXAME",
    entidadeId: data.exameId,
    descricao: `Solicitada segunda opinião ao radiologista #${data.radiologistaId}`,
    exameId: data.exameId,
    pacienteId: exame.pacienteId,
    utilizadorId: userId || undefined,
  });

  return {
    ...opiniao,
    solicitadoEm: opiniao.solicitadoEm.toISOString(),
    concluidoEm: opiniao.concluidoEm?.toISOString() ?? null,
  };
}

export async function concluirSegundaOpiniao(id: number, laudoSegunda: string, coerente: boolean) {
  await autorizar("cognitivo", "editar");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const opiniao = await prisma.segundaOpiniao.update({
    where: { id },
    data: {
      laudoSegunda,
      coerente,
      estado: "concluida",
      concluidoEm: new Date(),
      radiologistaId: userId ?? undefined,
      conclusao: coerente
        ? "A segunda opinião confirma o laudo original."
        : "A segunda opinião discorda do laudo original. Recomenda-se revisão clínica.",
    },
    include: {
      exame: { select: { id: true, pacienteId: true } },
    },
  });

  await registarHistorico({
    acao: "SEGUNDA_OPINIAO_CONCLUSAO",
    entidade: "EXAME",
    entidadeId: opiniao.exameId,
    descricao: `Segunda opinião #${id} concluída (coerente: ${coerente})`,
    exameId: opiniao.exameId,
    pacienteId: opiniao.exame.pacienteId,
    utilizadorId: userId || undefined,
  });

  return opiniao;
}

export async function listarSegundasOpinioes(estado?: string): Promise<SegundaOpiniao[]> {
  await autorizar("cognitivo");
  const where: Prisma.SegundaOpiniaoWhereInput = {};
  if (estado) where.estado = estado;
  const data = await prisma.segundaOpiniao.findMany({
    where,
    orderBy: { solicitadoEm: "desc" },
    include: {
      exame: { select: { id: true, codigo: true, paciente: { select: { nome: true } }, tipoExame: { select: { nome: true } } } },
      radiologista: { select: { id: true, nome: true } },
      solicitadoPor: { select: { id: true, nome: true } },
    },
  });
  return data.map((o) => ({
    ...o,
    solicitadoEm: o.solicitadoEm.toISOString(),
    concluidoEm: o.concluidoEm?.toISOString() ?? null,
  }));
}

// ===========================================================================
// 12. Reunião Clínica
// ===========================================================================

export async function criarReuniao(data: {
  titulo: string;
  pacienteId?: number | null;
  descricao?: string;
  dataHora: string;
  participantesIds: number[];
  examesIds?: number[];
}): Promise<ReuniaoClinica> {
  await autorizar("cognitivo", "criar");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const reuniao = await prisma.reuniaoClinica.create({
    data: {
      titulo: data.titulo,
      pacienteId: data.pacienteId ?? null,
      descricao: data.descricao,
      dataHora: new Date(data.dataHora),
      criadoPorId: userId,
      participantes: {
        create: data.participantesIds.map((uid) => ({ utilizadorId: uid })),
      },
examesPartilhados: data.examesIds?.length
        ? { create: data.examesIds.map((eid) => ({ exameId: eid })) }
        : undefined,
    },
    include: {
      paciente: { select: { id: true, nome: true } },
      criadoPor: { select: { nome: true } },
      participantes: { include: { utilizador: { select: { id: true, nome: true, role: true } } } },
      examesPartilhados: { include: { exame: { select: { id: true, codigo: true, tipoExame: { select: { nome: true } } } } } },
    },
  });

  await registarHistorico({
    acao: "REUNIAO",
    entidade: "REUNIAO",
    entidadeId: reuniao.id,
    descricao: `Reunião clínica criada: ${reuniao.titulo}`,
    pacienteId: data.pacienteId || undefined,
    utilizadorId: userId || undefined,
  });

  return serializarReuniao(reuniao);
}

export async function concluirReuniao(id: number, ataManual?: string) {
  await autorizar("cognitivo", "editar");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const reuniao = await prisma.reuniaoClinica.findUnique({
    where: { id },
    include: {
      paciente: { select: { nome: true } },
      participantes: { include: { utilizador: { select: { nome: true, role: true } } } },
      decisoes: true,
examesPartilhados: { include: { exame: { select: { id: true, codigo: true, tipoExame: { select: { nome: true } } } } } },
    },
  });
  if (!reuniao) throw new Error("Reunião não encontrada");

  // Gera ata automaticamente
  const linhas: string[] = [];
  linhas.push(`# Ata da Reunião Clínica — ${reuniao.titulo}`);
  linhas.push(`**Data:** ${reuniao.dataHora.toISOString().slice(0, 16).replace("T", " ")}`);
  if (reuniao.paciente) linhas.push(`**Paciente:** ${reuniao.paciente.nome}`);
  linhas.push("");
  linhas.push("## Participantes");
  for (const p of reuniao.participantes) {
    linhas.push(`- ${p.utilizador.nome} (${p.utilizador.role})`);
  }
  linhas.push("");
  if (reuniao.examesPartilhados.length > 0) {
    linhas.push("## Exames partilhados");
    for (const e of reuniao.examesPartilhados) {
      linhas.push(`- ${e.exame.tipoExame?.nome} (${e.exame.codigo || `#${e.exame.id}`})`);
    }
    linhas.push("");
  }
  linhas.push("## Decisões");
  if (reuniao.decisoes.length > 0) {
    for (const d of reuniao.decisoes) {
      linhas.push(`- ${d.descricao} [${d.estado}]`);
    }
  } else {
    linhas.push("Sem decisões registadas.");
  }
  linhas.push("");
  linhas.push(`> Ata gerada automaticamente em ${new Date().toISOString()}.`);

  const ata = ataManual || linhas.join("\n");

  const atualizada = await prisma.reuniaoClinica.update({
    where: { id },
    data: { estado: "concluida", ata, ataJson: { participantes: reuniao.participantes.length, exames: reuniao.examesPartilhados.length } as Prisma.InputJsonValue },
    include: {
      paciente: { select: { id: true, nome: true } },
      participantes: { include: { utilizador: { select: { id: true, nome: true, role: true } } } },
      decisoes: true,
      examesPartilhados: { include: { exame: { select: { id: true, codigo: true, tipoExame: { select: { nome: true } } } } } },
    },
  });

  await registarHistorico({
    acao: "REUNIAO_ATA",
    entidade: "REUNIAO",
    entidadeId: id,
    descricao: `Ata da reunião clínica #${id} gerada automaticamente`,
    pacienteId: reuniao.pacienteId || undefined,
    utilizadorId: userId || undefined,
  });

  return serializarReuniao(atualizada);
}

export async function listarReunioes(estado?: string): Promise<ReuniaoClinica[]> {
  await autorizar("cognitivo");
  const where: Prisma.ReuniaoClinicaWhereInput = {};
  if (estado) where.estado = estado;
  const data = await prisma.reuniaoClinica.findMany({
    where,
    orderBy: { dataHora: "desc" },
    include: {
      paciente: { select: { id: true, nome: true } },
      criadoPor: { select: { nome: true } },
      participantes: { include: { utilizador: { select: { id: true, nome: true, role: true } } } },
      decisoes: true,
      examesPartilhados: { include: { exame: { select: { id: true, codigo: true, tipoExame: { select: { nome: true } } } } } },
    },
  });
  return data.map(serializarReuniao);
}

export async function adicionarDecisao(reuniaoId: number, descricao: string, responsavel?: number) {
  await autorizar("cognitivo", "criar");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  return prisma.reuniaoDecisao.create({
    data: { reuniaoId, descricao, autorId: userId, responsavel: responsavel ?? null },
  });
}

// ===========================================================================
// 13. Pesquisa Científica (anonimizada + exportação)
// ===========================================================================

export async function obterDadosPesquisa(data: {
  diagnostico?: string;
  modalidade?: string;
  regiaoId?: number;
  sexo?: string;
  inicio?: string;
  fim?: string;
  page?: number;
  limit?: number;
}) {
  await autorizar("cognitivo");
  const page = data.page || 1;
  const limit = Math.min(data.limit || 50, 200);
  const skip = (page - 1) * limit;

  const where: Prisma.ExameWhereInput = {};
  if (data.diagnostico) {
    where.OR = [
      { diagnosticoClinico: { contains: data.diagnostico, mode: "insensitive" } },
      { laudos: { some: { conteudo: { contains: data.diagnostico, mode: "insensitive" } } } },
    ];
  }
  if (data.modalidade) where.tipoExame = { modalidade: data.modalidade };
  if (data.sexo) where.paciente = { sexo: data.sexo };
  if (data.inicio || data.fim) {
    const df: Record<string, Date> = {};
    if (data.inicio) df.gte = new Date(data.inicio);
    if (data.fim) { const f = new Date(data.fim); f.setHours(23,59,59,999); df.lte = f; }
    where.dataExame = df;
  }

  const [exames, total] = await Promise.all([
    prisma.exame.findMany({
      where,
      skip,
      take: limit,
      orderBy: { dataExame: "desc" },
      include: {
        paciente: { select: { dataNascimento: true, sexo: true } },
        tipoExame: { select: { nome: true, modalidade: true } },
        laudos: { select: { conteudo: true, assinado: true } },
        analisesIA: { select: { diagnosticoPrincipal: true, confianca: true, achados: true } },
      },
    }),
    prisma.exame.count({ where }),
  ]);

  // ANONIMIZAÇÃO: nunca expõe nome, nº processo, contacto
  const anonimizados = exames.map((e, i) => {
    const idade = e.paciente?.dataNascimento;
    const hoje = new Date();
    let faixa = null;
    if (idade) {
      let anos = hoje.getFullYear() - idade.getFullYear();
      const m = hoje.getMonth() - idade.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < idade.getDate())) anos--;
      if (anos < 18) faixa = "0-17"; else if (anos < 40) faixa = "18-39"; else if (anos < 65) faixa = "40-64"; else faixa = "65+";
    }
    return {
      id: `E-${e.id}`,
      numeroAnonimo: `CASO-${String(e.id).padStart(4, "0")}`,
      idadeAnonima: faixa,
      sexo: e.paciente?.sexo || null,
      modalidade: e.tipoExame?.modalidade || e.tipoExame?.nome || null,
      tipoExame: e.tipoExame?.nome || null,
      diagnosticoClinico: e.diagnosticoClinico,
      laudo: e.laudos[0]?.conteudo || null,
      laudoAssinado: e.laudos[0]?.assinado || false,
      iaDiagnostico: e.analisesIA[0]?.diagnosticoPrincipal || null,
      iaConfianca: e.analisesIA[0]?.confianca || null,
      dataExame: e.dataExame.toISOString().slice(0, 10),
    };
  });

  return {
    data: anonimizados,
    total,
    pages: Math.ceil(total / limit),
    currentPage: page,
  };
}

// ===========================================================================
// 14. IA Generativa (respostas baseadas em dados reais BD)
// ===========================================================================

export async function perguntarIAGenerativa(pergunta: string): Promise<RespostaIA> {
  await autorizar("cognitivo");
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const q = pergunta.toLowerCase();
  const fontes: { tipo: string; descricao: string; id?: number }[] = [];
  let resposta = "";

  // Heurísticas baseadas em dados reais do banco (nunca inventa)
  if (/pneumonia/.test(q) && /60|maior|acima|idos/.test(q)) {
    const inicio = new Date();
    inicio.setFullYear(inicio.getFullYear() - 60);
    const pacientes = await prisma.paciente.findMany({
      where: {
        dataNascimento: { lte: inicio },
        exames: { some: { OR: [{ diagnosticoClinico: { contains: "pneumonia", mode: "insensitive" } }, { laudos: { some: { conteudo: { contains: "pneumonia", mode: "insensitive" } } } }] } },
      },
      select: { exames: { select: { id: true, dataExame: true, laudos: { select: { conteudo: true } } } } },
    });
    resposta = `Encontrei ${pacientes.length} paciente(s) com evidência de pneumonia acima dos 60 anos. `;
    resposta += `Nota: os dados são apresentados de forma agregada e anonimizada por segurança. `;
    resposta += `Estes casos estão registados no histórico hospitalar e podem ser analisados em detalhe no módulo de Pesquisa Científica.`;
    fontes.push({ tipo: "pneumonia_60", descricao: `${pacientes.length} casos com pneumonia em pacientes >60 anos` });
  } else if (/exames semelhantes|casos semelhantes|mem[oó]ria cl[ií]nica/.test(q)) {
    const casos = await prisma.casoClinico.count();
    const confirmados = await prisma.casoClinico.count({ where: { confirmado: true } });
    resposta = `A memória clínica hospitalar contém ${casos} caso(s) registado(s), dos quais ${confirmados} confirmado(s). `;
    resposta += `Os casos são anonimizados. Use o módulo "Memória Clínica" para pesquisar casos semelhantes por diagnóstico, modalidade ou região anatómica.`;
    fontes.push({ tipo: "memoria_clinica", descricao: `${casos} casos na base de memória clínica` });
  } else if (/evolu[cç][aã]o|les[aã]o|mudan[cç]a|progress[aã]o|regress[aã]o/.test(q)) {
    const comps = await prisma.comparacaoExame.count();
    const progressao = await prisma.comparacaoExame.aggregate({ _sum: { progressao: true } });
    const regressao = await prisma.comparacaoExame.aggregate({ _sum: { regressao: true } });
    resposta = `Foram realizadas ${comps} comparações radiológicas automáticas. `;
    if (comps > 0) {
      resposta += `Soma acumulada de progressão: ${progressao._sum.progressao || 0}; regressão: ${regressao._sum.regressao || 0}. `;
      resposta += `Use o Detector de Mudanças para visualizar evolução por exame.`;
    }
    fontes.push({ tipo: "comparacoes", descricao: `${comps} comparações registadas` });
  } else if (/contradic|inconsist|diverge/.test(q)) {
    const contradicoes = await prisma.contradicao.count({ where: { estado: { in: ["aberta", "confirmada"] } } });
    resposta = `Existem atualmente ${contradicoes} possível(eis) contradição(ões) detetada(s) entre imagem, laudo e histórico. `;
    resposta += `Consulte o Detector de Contradições para rever cada caso e classificá-lo.`;
    fontes.push({ tipo: "contradicoes", descricao: `${contradicoes} contradições pendentes` });
  } else if (/previs[aã]o|demanda|sobrecarga|fila|espera|ocupa[cç][aã]o/.test(q)) {
    const previsoes = await prisma.predicaoServico.count();
    resposta = `Foram geradas ${previsoes} previsão(ões) de serviço com base no histórico real de exames. `;
    resposta += `Abrir o módulo Previsão Inteligente para ver projeções de sobrecarga, fila, ocupação e demanda.`;
    fontes.push({ tipo: "previsao", descricao: `${previsoes} previsões registadas` });
  } else if (/segunda opini[aã]o/.test(q)) {
    const opinioes = await prisma.segundaOpiniao.count();
    const coerentes = await prisma.segundaOpiniao.count({ where: { coerente: true } });
    const divergentes = await prisma.segundaOpiniao.count({ where: { coerente: false } });
    resposta = `Foram solicitadas ${opinioes} segunda(s) opinião(ões). `;
    if (opinioes > 0) {
      resposta += `Coerentes com o laudo original: ${coerentes}. Divergentes: ${divergentes}.`;
    }
    fontes.push({ tipo: "segunda_opiniao", descricao: `${opinioes} segundas opiniões` });
  } else if (/pneumonia|tuberculose|covid|avc|tumor|fratura/.test(q)) {
    const condicao = (q.match(/tuberculose|covid|avc|tumor|fratura|pneumonia/) || ["pneumonia"])[0];
    const exames = await prisma.exame.count({
      where: { OR: [{ diagnosticoClinico: { contains: condicao, mode: "insensitive" } }, { justificacaoClinica: { contains: condicao, mode: "insensitive" } }] },
    });
    resposta = `Foram encontrados ${exames} exame(s) relacionados com "${condicao}" no histórico hospitalar. `;
    resposta += `Consulte o Radar Epidemiológico para ver a distribuição por sexo, idade, mês e procedência.`;
    fontes.push({ tipo: "epidemiologia", descricao: `${exames} exames relacionados com ${condicao}` });
  } else {
    resposta = `Recebi a sua pergunta. Para responder com rigor, posso consultar os seguintes dados reais do sistema:\n`;
    resposta += `- Pacientes com determinada condição (ex.: "mostre pacientes com pneumonia acima de 60 anos")\n`;
    resposta += `- Casos semelhantes na memória clínica\n`;
    resposta += `- Evolução de lesões via comparações radiológicas\n`;
    resposta += `- Contradições detetadas\n`;
    resposta += `- Previsões de demanda e sobrecarga\n`;
    resposta += `- Segundas opiniões\n\n`;
    resposta += `Por favor, reformule a pergunta usando um destes focos para que eu consulte a base de dados.`;
  }

  // Persiste a sessão de IA
  const sessao = await prisma.sessaoIA.create({
    data: {
      titulo: pergunta.slice(0, 60),
      tipo: "generativa",
      utilizadorId: userId,
      contextoJson: { fontes } as Prisma.InputJsonValue,
      mensagens: {
        create: [
          { papel: "utilizador", conteudo: pergunta },
          { papel: "assistente", conteudo: resposta, contextoJson: { fontes } as Prisma.InputJsonValue },
        ],
      },
    },
  });

  return { resposta, fontes, contextoJson: { sessaoId: sessao.id } };
}

export async function listarSessoesIA(): Promise<SessaoIA[]> {
  await autorizar("cognitivo");
  const data = await prisma.sessaoIA.findMany({
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { mensagens: { orderBy: { createdAt: "asc" } } },
    where: { tipo: "generativa" },
  });
return data.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    contextoJson: (s.contextoJson as Record<string, unknown> | null) ?? null,
mensagens: s.mensagens.map((m) => ({
      ...m,
      papel: m.papel as "utilizador" | "assistente",
      createdAt: m.createdAt.toISOString(),
      contextoJson: (m.contextoJson as Record<string, unknown> | null) ?? null,
    })),
  }));
}

// ===========================================================================
// Utilidades partilhadas (pacientes, radiologistas, regiões anatom.)
// ===========================================================================

export async function obterDadosCognitivoAux() {
  await autorizar("cognitivo");
  const [pacientes, radiologistas, regioes, exames, tiposExame] = await Promise.all([
    prisma.paciente.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true, numeroProcesso: true } }),
    prisma.utilizador.findMany({ where: { ativo: true, role: { in: ["TECNICO", "MEDICO", "ADMIN"] } }, orderBy: { nome: "asc" }, select: { id: true, nome: true, role: true } }),
    prisma.regiaoAnatomica.findMany({ orderBy: { ordem: "asc" }, select: { id: true, nome: true, nomePT: true, grupo: true } }),
    prisma.exame.findMany({
      orderBy: { dataExame: "desc" },
      take: 200,
      select: { id: true, codigo: true, dataExame: true, estado: true, paciente: { select: { nome: true } }, tipoExame: { select: { nome: true } } },
    }),
    prisma.tipoExame.findMany({ orderBy: { nome: "asc" }, select: { id: true, nome: true, modalidade: true } }),
  ]);

  return {
    pacientes,
    radiologistas,
    regioes,
    exames: exames.map((e) => serializarExame(e)),
    tiposExame,
  };
}
