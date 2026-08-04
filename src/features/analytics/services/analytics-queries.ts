"use server";

import { prisma } from "@/lib/db";
import type {
  AnalyticsFilters,
  DashboardMetrics,
  ExamesPorMes,
  ExamesPorModalidade,
  ExamesPorProcedencia,
  ExamesPorTecnico,
  ExamesPorSexo,
  ExamesPorFaixaEtaria,
  RelatorioMensal,
  RelatorioAnual,
} from "../types";
import { MODALIDADE_CORES, FAIXAS_ETARIAS } from "../types";

function buildDateFilter(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return {};
  const filter: Record<string, Date> = {};
  if (startDate) filter.gte = new Date(startDate);
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.lte = end;
  }
  return filter;
}

function calcularIdade(dataNascimento: Date | null): number | null {
  if (!dataNascimento) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNascimento.getFullYear();
  const mesDiff = hoje.getMonth() - dataNascimento.getMonth();
  if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < dataNascimento.getDate())) {
    idade--;
  }
  return idade;
}

export async function getDashboardMetrics(filters?: AnalyticsFilters): Promise<DashboardMetrics> {
  const dateFilter = buildDateFilter(filters?.startDate, filters?.endDate);
  const whereExame: any = {};
  if (Object.keys(dateFilter).length > 0) whereExame.dataExame = dateFilter;
  if (filters?.modalidade) {
    whereExame.tipoExame = { modalidade: filters.modalidade };
  }
  if (filters?.procedencia) {
    whereExame.procedencia = { nome: filters.procedencia };
  }
  if (filters?.tecnicoId) {
    whereExame.tecnicoId = filters.tecnicoId;
  }
  if (filters?.sexo) {
    whereExame.paciente = { sexo: filters.sexo };
  }

  const [
    totalExames,
    totalPacientes,
    examesMesAtual,
    modalidades,
    procedencias,
    sexos,
  ] = await Promise.all([
    prisma.exame.count({ where: whereExame }),
    prisma.exame.findMany({
      where: whereExame,
      select: { pacienteId: true },
      distinct: ['pacienteId'],
    }),
    prisma.exame.count({
      where: {
        ...whereExame,
        dataExame: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999),
        },
      },
    }),
    prisma.exame.groupBy({
      by: ['tipoExameId'],
      _count: { id: true },
      where: whereExame,
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.exame.groupBy({
      by: ['procedenciaId'],
      _count: { id: true },
      where: { ...whereExame, procedenciaId: { not: null } },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.paciente.groupBy({
      by: ['sexo'],
      _count: { id: true },
      where: filters?.sexo ? { sexo: filters.sexo } : {},
    }),
  ]);

  // Get modalidade names
  const tiposExame = await prisma.tipoExame.findMany({
    where: { id: { in: modalidades.map(m => m.tipoExameId) } },
  });
  const modalidadePrincipal = tiposExame.find(t => t.id === modalidades[0]?.tipoExameId);
  const modalidadeMap = new Map(tiposExame.map(t => [t.id, t]));

  // Aggregate modalidades by modalidade name
  const modalidadeAgg: Record<string, number> = {};
  modalidades.forEach(m => {
    const tipo = modalidadeMap.get(m.tipoExameId);
    const nome = tipo?.modalidade || tipo?.nome || 'Desconhecido';
    modalidadeAgg[nome] = (modalidadeAgg[nome] || 0) + m._count.id;
  });
  const topModalidade = Object.entries(modalidadeAgg).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Get procedencia names
  const procedenciasData = await prisma.procedencia.findMany({
    where: { id: { in: procedencias.map(p => p.procedenciaId!).filter(Boolean) } },
  });
  const procedenciaMap = new Map(procedenciasData.map(p => [p.id, p.nome]));
  const topProcedencia = procedencias[0] ? (procedenciaMap.get(procedencias[0].procedenciaId!) || 'N/A') : 'N/A';

  const totalSexo = sexos.reduce((sum, s) => sum + s._count.id, 0);
  const sexoPredominante = sexos.sort((a, b) => b._count.id - a._count.id)[0];

  return {
    totalExames,
    totalPacientes: totalPacientes.length,
    examesMesAtual,
    modalidadePrincipal: topModalidade,
    procedenciaPrincipal: topProcedencia,
    sexoPredominante: {
      sexo: sexoPredominante?.sexo || 'N/A',
      percentagem: totalSexo > 0 ? Math.round((sexoPredominante?._count.id || 0) / totalSexo * 100) : 0,
    },
    pacientesAtendidos: totalPacientes.length,
    pacientesUnicos: new Set(totalPacientes.map(p => p.pacienteId)).size,
  };
}

export async function getExamesPorMes(filters?: AnalyticsFilters): Promise<ExamesPorMes[]> {
  const dateFilter = buildDateFilter(
    filters?.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString(),
    filters?.endDate
  );
  const whereExame: any = {};
  if (Object.keys(dateFilter).length > 0) whereExame.dataExame = dateFilter;
  if (filters?.modalidade) whereExame.tipoExame = { modalidade: filters.modalidade };
  if (filters?.procedencia) whereExame.procedencia = { nome: filters.procedencia };
  if (filters?.tecnicoId) whereExame.tecnicoId = filters.tecnicoId;

  const exames = await prisma.exame.findMany({
    where: whereExame,
    select: { dataExame: true },
    orderBy: { dataExame: 'asc' },
  });

  const monthlyMap: Record<string, number> = {};
  exames.forEach(e => {
    const key = `${e.dataExame.getFullYear()}-${String(e.dataExame.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + 1;
  });

  const result: ExamesPorMes[] = Object.entries(monthlyMap).map(([mes, total]) => ({ mes, total }));

  // Calcular crescimento
  for (let i = 1; i < result.length; i++) {
    const anterior = result[i - 1].total;
    result[i].crescimento = anterior > 0 ? Math.round(((result[i].total - anterior) / anterior) * 100) : 0;
  }

  return result;
}

export async function getExamesPorModalidade(filters?: AnalyticsFilters): Promise<ExamesPorModalidade[]> {
  const dateFilter = buildDateFilter(filters?.startDate, filters?.endDate);
  const whereExame: any = {};
  if (Object.keys(dateFilter).length > 0) whereExame.dataExame = dateFilter;
  if (filters?.modalidade) whereExame.tipoExame = { modalidade: filters.modalidade };
  if (filters?.procedencia) whereExame.procedencia = { nome: filters.procedencia };
  if (filters?.tecnicoId) whereExame.tecnicoId = filters.tecnicoId;

  const exames = await prisma.exame.findMany({
    where: whereExame,
    select: { tipoExameId: true },
  });

  const tiposExame = await prisma.tipoExame.findMany({
    where: { id: { in: [...new Set(exames.map(e => e.tipoExameId))] } },
  });
  const tipoMap = new Map(tiposExame.map(t => [t.id, t.modalidade || t.nome]));

  const modalidadeCount: Record<string, number> = {};
  exames.forEach(e => {
    const nome = tipoMap.get(e.tipoExameId) || 'Desconhecido';
    modalidadeCount[nome] = (modalidadeCount[nome] || 0) + 1;
  });

  const total = exames.length;
  const entries = Object.entries(modalidadeCount).sort((a, b) => b[1] - a[1]);

  return entries.map(([modalidade, count], index) => ({
    modalidade,
    total: count,
    percentagem: total > 0 ? Math.round((count / total) * 100) : 0,
    cor: MODALIDADE_CORES[index % MODALIDADE_CORES.length],
  }));
}

export async function getExamesPorProcedencia(filters?: AnalyticsFilters): Promise<ExamesPorProcedencia[]> {
  const dateFilter = buildDateFilter(filters?.startDate, filters?.endDate);
  const whereExame: any = {};
  if (Object.keys(dateFilter).length > 0) whereExame.dataExame = dateFilter;
  if (filters?.modalidade) whereExame.tipoExame = { modalidade: filters.modalidade };
  if (filters?.procedencia) whereExame.procedencia = { nome: filters.procedencia };
  if (filters?.tecnicoId) whereExame.tecnicoId = filters.tecnicoId;

  const exames = await prisma.exame.findMany({
    where: { ...whereExame, procedenciaId: { not: null } },
    select: { procedenciaId: true },
  });

  const procedencias = await prisma.procedencia.findMany({
    where: { id: { in: [...new Set(exames.map(e => e.procedenciaId!))] } },
  });
  const procMap = new Map(procedencias.map(p => [p.id, p.nome]));

  const procCount: Record<string, number> = {};
  exames.forEach(e => {
    const nome = procMap.get(e.procedenciaId!) || 'Desconhecido';
    procCount[nome] = (procCount[nome] || 0) + 1;
  });

  const total = exames.length;
  const entries = Object.entries(procCount).sort((a, b) => b[1] - a[1]);

  return entries.map(([procedencia, count]) => ({
    procedencia,
    total: count,
    percentagem: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

export async function getExamesPorTecnico(filters?: AnalyticsFilters): Promise<ExamesPorTecnico[]> {
  const dateFilter = buildDateFilter(filters?.startDate, filters?.endDate);
  const whereExame: any = {};
  if (Object.keys(dateFilter).length > 0) whereExame.dataExame = dateFilter;
  if (filters?.modalidade) whereExame.tipoExame = { modalidade: filters.modalidade };
  if (filters?.procedencia) whereExame.procedencia = { nome: filters.procedencia };
  if (filters?.tecnicoId) whereExame.tecnicoId = filters.tecnicoId;

  const exames = await prisma.exame.findMany({
    where: { ...whereExame, tecnicoId: { not: null } },
    select: { tecnicoId: true },
  });

  const tecnicos = await prisma.tecnico.findMany({
    where: { id: { in: [...new Set(exames.map(e => e.tecnicoId!))] } },
  });
  const tecMap = new Map(tecnicos.map(t => [t.id, t.nome]));

  const tecCount: Record<string, { tecnicoId: number; total: number }> = {};
  exames.forEach(e => {
    const nome = tecMap.get(e.tecnicoId!) || 'Desconhecido';
    if (!tecCount[nome]) tecCount[nome] = { tecnicoId: e.tecnicoId!, total: 0 };
    tecCount[nome].total++;
  });

  const total = exames.length;
  const entries = Object.entries(tecCount).sort((a, b) => b[1].total - a[1].total);

  return entries.map(([tecnico, data]) => ({
    tecnico,
    tecnicoId: data.tecnicoId,
    total: data.total,
    percentagem: total > 0 ? Math.round((data.total / total) * 100) : 0,
  }));
}

export async function getExamesPorSexo(filters?: AnalyticsFilters): Promise<ExamesPorSexo[]> {
  const dateFilter = buildDateFilter(filters?.startDate, filters?.endDate);
  const whereExame: any = {};
  if (Object.keys(dateFilter).length > 0) whereExame.dataExame = dateFilter;
  if (filters?.modalidade) whereExame.tipoExame = { modalidade: filters.modalidade };
  if (filters?.procedencia) whereExame.procedencia = { nome: filters.procedencia };
  if (filters?.tecnicoId) whereExame.tecnicoId = filters.tecnicoId;

  const exames = await prisma.exame.findMany({
    where: whereExame,
    select: { paciente: { select: { sexo: true } } },
  });

  const sexoCount: Record<string, number> = {};
  exames.forEach(e => {
    const sexo = e.paciente?.sexo || 'N/A';
    sexoCount[sexo] = (sexoCount[sexo] || 0) + 1;
  });

  const total = exames.length;
  const entries = Object.entries(sexoCount).sort((a, b) => b[1] - a[1]);

  return entries.map(([sexo, count]) => ({
    sexo,
    total: count,
    percentagem: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
}

export async function getExamesPorFaixaEtaria(filters?: AnalyticsFilters): Promise<ExamesPorFaixaEtaria[]> {
  const dateFilter = buildDateFilter(filters?.startDate, filters?.endDate);
  const whereExame: any = {};
  if (Object.keys(dateFilter).length > 0) whereExame.dataExame = dateFilter;
  if (filters?.modalidade) whereExame.tipoExame = { modalidade: filters.modalidade };
  if (filters?.procedencia) whereExame.procedencia = { nome: filters.procedencia };
  if (filters?.tecnicoId) whereExame.tecnicoId = filters.tecnicoId;

  const exames = await prisma.exame.findMany({
    where: whereExame,
    select: { paciente: { select: { dataNascimento: true } } },
  });

  const faixaCount: Record<string, number> = {};
  exames.forEach(e => {
    const idade = calcularIdade(e.paciente?.dataNascimento || null);
    let faixa = 'Desconhecido';
    if (idade !== null) {
      for (const f of FAIXAS_ETARIAS) {
        if (idade >= f.min && idade <= f.max) {
          faixa = f.label;
          break;
        }
      }
    }
    faixaCount[faixa] = (faixaCount[faixa] || 0) + 1;
  });

  const total = exames.length;
  return FAIXAS_ETARIAS.map(f => ({
    faixa: f.label,
    total: faixaCount[f.label] || 0,
    percentagem: total > 0 ? Math.round(((faixaCount[f.label] || 0) / total) * 100) : 0,
  }));
}

export async function getRelatorioMensal(
  mes: number,
  ano: number,
  filters?: AnalyticsFilters
): Promise<RelatorioMensal> {
  const startDate = new Date(ano, mes - 1, 1);
  const endDate = new Date(ano, mes, 0, 23, 59, 59, 999);

  const dateFilter = { gte: startDate, lte: endDate };
  const whereExame: any = { dataExame: dateFilter };
  if (filters?.modalidade) whereExame.tipoExame = { modalidade: filters.modalidade };
  if (filters?.procedencia) whereExame.procedencia = { nome: filters.procedencia };
  if (filters?.tecnicoId) whereExame.tecnicoId = filters.tecnicoId;

  const [totalExames, pacientes, modalidadeData, sexoData, procedenciaData, tecnicoData, faixaData] =
    await Promise.all([
      prisma.exame.count({ where: whereExame }),
      prisma.exame.findMany({
        where: whereExame,
        select: { pacienteId: true },
        distinct: ['pacienteId'],
      }),
      getExamesPorModalidade({ ...filters, startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
      getExamesPorSexo({ ...filters, startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
      getExamesPorProcedencia({ ...filters, startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
      getExamesPorTecnico({ ...filters, startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
      getExamesPorFaixaEtaria({ ...filters, startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
    ]);

  // Exames por dia do mês
  const exames = await prisma.exame.findMany({
    where: whereExame,
    select: { dataExame: true },
    orderBy: { dataExame: 'asc' },
  });

  const examesPorDia: Record<string, number> = {};
  exames.forEach(e => {
    const dia = String(e.dataExame.getDate()).padStart(2, '0');
    examesPorDia[dia] = (examesPorDia[dia] || 0) + 1;
  });

  return {
    mes: String(mes).padStart(2, '0'),
    ano,
    totalExames,
    totalPacientes: pacientes.length,
    pacientesUnicos: new Set(pacientes.map(p => p.pacienteId)).size,
    distribuicaoModalidade: modalidadeData,
    distribuicaoSexo: sexoData,
    procedencias: procedenciaData,
    tecnicos: tecnicoData,
    faixaEtaria: faixaData,
    examesPorDia: Object.entries(examesPorDia).map(([dia, total]) => ({ dia, total })),
  };
}

export async function getRelatorioAnual(ano: number, filters?: AnalyticsFilters): Promise<RelatorioAnual> {
  const startDate = new Date(ano, 0, 1);
  const endDate = new Date(ano, 11, 31, 23, 59, 59, 999);

  const whereExame: any = {
    dataExame: { gte: startDate, lte: endDate },
  };
  if (filters?.modalidade) whereExame.tipoExame = { modalidade: filters.modalidade };
  if (filters?.procedencia) whereExame.procedencia = { nome: filters.procedencia };
  if (filters?.tecnicoId) whereExame.tecnicoId = filters.tecnicoId;

  const [totalExames, pacientes, examesPorMes] = await Promise.all([
    prisma.exame.count({ where: whereExame }),
    prisma.exame.findMany({
      where: whereExame,
      select: { pacienteId: true },
      distinct: ['pacienteId'],
    }),
    getExamesPorMes({ ...filters, startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
  ]);

  // Calcular médias e tendências
  const tendencias = examesPorMes.map(m => {
    const media = Math.round(examesPorMes.reduce((acc, cur) => acc + cur.total, 0) / examesPorMes.length);
    let tendencia: 'up' | 'down' | 'stable' = 'stable';
    if (m.crescimento && m.crescimento > 5) tendencia = 'up';
    else if (m.crescimento && m.crescimento < -5) tendencia = 'down';
    return { mes: m.mes, media, tendencia };
  });

  // Top modalidade, procedencia, tecnico
  const modalidadeData = await getExamesPorModalidade({ ...filters, startDate: startDate.toISOString(), endDate: endDate.toISOString() });
  const procedenciaData = await getExamesPorProcedencia({ ...filters, startDate: startDate.toISOString(), endDate: endDate.toISOString() });
  const tecnicoData = await getExamesPorTecnico({ ...filters, startDate: startDate.toISOString(), endDate: endDate.toISOString() });

  return {
    ano,
    totalExames,
    totalPacientes: pacientes.length,
    crescimentoMensal: examesPorMes,
    comparacaoMeses: examesPorMes,
    tendencias,
    topModalidade: modalidadeData[0]?.modalidade || 'N/A',
    topProcedencia: procedenciaData[0]?.procedencia || 'N/A',
    topTecnico: tecnicoData[0]?.tecnico || 'N/A',
  };
}