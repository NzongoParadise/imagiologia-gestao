"use server";

import { prisma } from "@/lib/db";

interface FiltrosRelatorio {
  dataInicio: Date;
  dataFim: Date;
  estado?: string;
  procedenciaId?: number;
  tecnicoId?: number;
  tipoExameId?: number;
}

export async function getRelatorioPeriodo(filtros: FiltrosRelatorio) {
  const { dataInicio, dataFim, estado, procedenciaId, tecnicoId, tipoExameId } = filtros;

  // Construir where dinâmico
  const whereBase: Record<string, unknown> = {
    dataExame: { gte: dataInicio, lte: dataFim },
  };

  if (estado && estado !== "todos") {
    whereBase.estado = estado;
  }

  if (procedenciaId && procedenciaId > 0) {
    whereBase.procedenciaId = procedenciaId;
  }

  if (tecnicoId && tecnicoId > 0) {
    whereBase.tecnicoId = tecnicoId;
  }

  if (tipoExameId && tipoExameId > 0) {
    whereBase.tipoExameId = tipoExameId;
  }

  // Total de exames no período
  const totalExames = await prisma.exame.count({
    where: whereBase,
  });

  // Exames atendidos (Realizado + Entregue)
  const examesAtendidos = await prisma.exame.count({
    where: { ...whereBase, estado: { in: ["Realizado", "Entregue"] } },
  });

  // Exames pendentes
  const examesPendentes = await prisma.exame.count({
    where: { ...whereBase, estado: { in: ["Pendente", "Em andamento"] } },
  });

  // Exames cancelados
  const examesCancelados = await prisma.exame.count({
    where: { ...whereBase, estado: "Cancelado" },
  });

  // Exames por procedência
  const examesPorProcedencia = await prisma.exame.groupBy({
    by: ["procedenciaId"],
    where: whereBase,
    _count: { id: true },
  });

  const procedencias = await prisma.procedencia.findMany({
    select: { id: true, nome: true },
  });

  const procedenciasData = examesPorProcedencia.map((e) => {
    const proc = procedencias.find((p) => p.id === e.procedenciaId);
    return {
      procedencia: proc?.nome || "Sem procedência",
      count: e._count.id,
    };
  });

  // Exames por modalidade/secção
  const examesPorModalidade = await prisma.exame.groupBy({
    by: ["tipoExameId"],
    where: whereBase,
    _count: { id: true },
  });

  const tipos = await prisma.tipoExame.findMany({
    select: { id: true, nome: true, modalidade: true },
  });

  const modalidadesData = examesPorModalidade.map((e) => {
    const tipo = tipos.find((t) => t.id === e.tipoExameId);
    return {
      modalidade: tipo?.modalidade || tipo?.nome || "Desconhecido",
      tipoExame: tipo?.nome || "Desconhecido",
      count: e._count.id,
    };
  });

  // Sexo mais atendido
  const examesComPacientes = await prisma.exame.findMany({
    where: whereBase,
    select: {
      paciente: { select: { sexo: true } },
    },
  });

  const contagemSexo: Record<string, number> = {};
  examesComPacientes.forEach((e) => {
    const sexo = e.paciente?.sexo || "Não especificado";
    contagemSexo[sexo] = (contagemSexo[sexo] || 0) + 1;
  });

  const sexoData = Object.entries(contagemSexo)
    .filter(([sexo]) => sexo !== "Não especificado")
    .sort((a, b) => b[1] - a[1]);

  const sexoMaisAtendido = sexoData.length > 0 ? sexoData[0][0] : "N/A";
  const totalSexoMapeado = sexoData.reduce((acc, [, count]) => acc + count, 0);

  // Exames por técnico
  const examesPorTecnico = await prisma.exame.groupBy({
    by: ["tecnicoId"],
    where: whereBase,
    _count: { id: true },
  });

  const tecnicos = await prisma.tecnico.findMany({
    select: { id: true, nome: true },
  });

  const tecnicosData = examesPorTecnico.map((e) => {
    const tec = tecnicos.find((t) => t.id === e.tecnicoId);
    return {
      tecnico: tec?.nome || "Não atribuído",
      count: e._count.id,
    };
  });

  // Contagem por dia no período (para gráfico de linha)
  const examesDoPeriodo = await prisma.exame.findMany({
    where: whereBase,
    select: { dataExame: true },
    orderBy: { dataExame: "asc" },
  });

  const dailyMap: Record<string, number> = {};
  examesDoPeriodo.forEach((e) => {
    const key = `${e.dataExame.getFullYear()}-${String(e.dataExame.getMonth() + 1).padStart(2, "0")}-${String(e.dataExame.getDate()).padStart(2, "0")}`;
    dailyMap[key] = (dailyMap[key] || 0) + 1;
  });

  const tendenciaDiaria = Object.entries(dailyMap).map(([dia, total]) => ({
    dia,
    total,
  }));

  return {
    dataInicio: dataInicio.toISOString(),
    dataFim: dataFim.toISOString(),
    totalExames,
    examesAtendidos,
    examesPendentes,
    examesCancelados,
    taxaAtendimento: totalExames > 0 ? Math.round((examesAtendidos / totalExames) * 100) : 0,
    procedencias: procedenciasData,
    modalidades: modalidadesData,
    tecnicos: tecnicosData,
    sexoMaisAtendido,
    totalSexoMapeado,
    contagemSexo: Object.fromEntries(sexoData),
    tendenciaDiaria,
  };
}

export async function getResumoGeral() {
  const [totalExames, totalPacientes, procedencias, tecnicos, tiposExame] = await Promise.all([
    prisma.exame.count(),
    prisma.paciente.count(),
    prisma.procedencia.findMany({ where: { ativo: true }, select: { id: true, nome: true } }),
    prisma.tecnico.findMany({ where: { ativo: true }, select: { id: true, nome: true } }),
    prisma.tipoExame.findMany({ where: { ativo: true }, select: { id: true, nome: true, modalidade: true } }),
  ]);

  const examesHoje = await prisma.exame.count({
    where: {
      dataExame: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
  });

  const examesEsteMes = await prisma.exame.count({
    where: {
      dataExame: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999),
      },
    },
  });

  return {
    totalExames,
    totalPacientes,
    examesHoje,
    examesEsteMes,
    procedencias,
    tecnicos,
    tiposExame,
  };
}

export type RelatorioPeriodo = Awaited<ReturnType<typeof getRelatorioPeriodo>>;
export type RelatorioResumoGeral = Awaited<ReturnType<typeof getResumoGeral>>;

