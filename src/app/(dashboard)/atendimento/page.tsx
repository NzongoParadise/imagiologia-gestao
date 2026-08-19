import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { AtendimentoClient } from "./atendimento-client";

export const dynamic = "force-dynamic";

export default async function AtendimentoPage() {
  await verificarPermissao("atendimento");

  const hoje = new Date().toISOString().slice(0, 10);
  const inicio = new Date(`${hoje}T00:00:00.000Z`);
  const fim = new Date(`${hoje}T23:59:59.999Z`);

  const [
    totalHoje,
    consultasHoje,
    urgenciasHoje,
    aguardando,
    emAtendimento,
    concluidos,
    encaminhamentosPendentes,
    porEstado,
    especialidades,
    bancosUrgencia,
    classificacoesRisco,
    consultasRecentes,
    urgenciasRecentes,
    filaAtendimento,
    encaminhamentos,
    consultorios,
  ] = await Promise.all([
    prisma.atendimento.count({ where: { criadoEm: { gte: inicio, lte: fim } } }),
    prisma.atendimento.count({ where: { criadoEm: { gte: inicio, lte: fim }, tipo: "CONSULTA" } }),
    prisma.atendimento.count({ where: { criadoEm: { gte: inicio, lte: fim }, tipo: "URGENCIA" } }),
    prisma.atendimento.count({ where: { estado: { in: ["AGUARDANDO", "EM_TRIAGEM"] } } }),
    prisma.atendimento.count({ where: { estado: "EM_ATENDIMENTO" } }),
    prisma.atendimento.count({ where: { estado: "CONCLUIDO" } }),
    prisma.encaminhamento.count({ where: { estado: { in: ["PENDENTE", "AGUARDANDO"] } } }),
    prisma.atendimento.groupBy({
      by: ["estado"],
      _count: true,
    }),
    prisma.especialidade.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.bancoUrgencia.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.classificacaoRisco.findMany({
      where: { ativo: true },
      orderBy: { nivel: "desc" },
    }),
    prisma.atendimento.findMany({
      where: { tipo: "CONSULTA" },
      orderBy: { criadoEm: "desc" },
      take: 20,
      include: {
        paciente: { select: { id: true, nome: true, numeroProcesso: true } },
        especialidade: { select: { id: true, nome: true } },
        consulta: {
          include: { medico: { select: { id: true, nome: true } } },
        },
        senha: { select: { codigo: true, status: true } },
      },
    }),
    prisma.atendimento.findMany({
      where: { tipo: "URGENCIA" },
      orderBy: { criadoEm: "desc" },
      take: 20,
      include: {
        paciente: { select: { id: true, nome: true, numeroProcesso: true } },
        urgencia: {
          include: {
            bancoUrgencia: { select: { id: true, nome: true, tipo: true } },
            classificacao: { select: { id: true, nome: true, cor: true, tempoMaximo: true } },
            medico: { select: { id: true, nome: true } },
          },
        },
        senha: { select: { codigo: true, status: true } },
      },
    }),
    prisma.filaAtendimento.findMany({
      where: { status: { in: ["EM_FILA", "CHAMADO", "EM_ATENDIMENTO"] } },
      orderBy: { posicao: "asc" },
      take: 20,
      include: {
        atendimento: {
          include: {
            paciente: { select: { id: true, nome: true, numeroProcesso: true } },
            especialidade: { select: { id: true, nome: true } },
            senha: { select: { codigo: true } },
          },
        },
        especialidade: { select: { id: true, nome: true } },
      },
    }),
    prisma.encaminhamento.findMany({
      where: { estado: { in: ["PENDENTE", "AGUARDANDO"] } },
      orderBy: { criadoEm: "desc" },
      take: 10,
      include: {
        paciente: { select: { id: true, nome: true, numeroProcesso: true } },
        atendimento: { select: { id: true, codigo: true, tipo: true } },
      },
    }),
    prisma.consultorio.findMany({
      where: { ativo: true },
      orderBy: { numero: "asc" },
      select: {
        id: true,
        numero: true,
        nome: true,
        bloco: true,
        andar: true,
        especialidade: { select: { id: true, nome: true } },
      },
    }),
  ]);

  const estatisticas = {
    totalHoje,
    consultasHoje,
    urgenciasHoje,
    aguardando,
    emAtendimento,
    concluidos,
    encaminhamentosPendentes,
    porEstado,
  };

  return (
    <AtendimentoClient
      estatisticas={JSON.parse(JSON.stringify(estatisticas))}
      especialidades={JSON.parse(JSON.stringify(especialidades))}
      bancosUrgencia={JSON.parse(JSON.stringify(bancosUrgencia))}
      classificacoesRisco={JSON.parse(JSON.stringify(classificacoesRisco))}
      consultasRecentes={JSON.parse(JSON.stringify(consultasRecentes))}
      urgenciasRecentes={JSON.parse(JSON.stringify(urgenciasRecentes))}
      filaAtendimento={JSON.parse(JSON.stringify(filaAtendimento))}
      encaminhamentos={JSON.parse(JSON.stringify(encaminhamentos))}
      consultorios={JSON.parse(JSON.stringify(consultorios))}
    />
  );
}
