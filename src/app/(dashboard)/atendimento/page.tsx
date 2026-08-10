import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { AtendimentoClient } from "./atendimento-client";

export const dynamic = "force-dynamic";

export default async function AtendimentoPage() {
  await verificarPermissao("atendimento");

  const hoje = new Date().toISOString().slice(0, 10);
  const inicio = new Date(`${hoje}T00:00:00.000Z`);
  const fim = new Date(`${hoje}T23:59:59.999Z`);

  const [totalHoje, consultasHoje, urgenciasHoje, aguardando, emAtendimento, concluidos, encaminhamentosPendentes, porEstado] =
    await Promise.all([
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

  const especialidades = await prisma.especialidade.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
  const bancosUrgencia = await prisma.bancoUrgencia.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });
  const classificacoesRisco = await prisma.classificacaoRisco.findMany({
    where: { ativo: true },
    orderBy: { nivel: "asc" },
  });

  return (
    <AtendimentoClient
      estatisticas={JSON.parse(JSON.stringify(estatisticas))}
      especialidades={JSON.parse(JSON.stringify(especialidades))}
      bancosUrgencia={JSON.parse(JSON.stringify(bancosUrgencia))}
      classificacoesRisco={JSON.parse(JSON.stringify(classificacoesRisco))}
    />
  );
}
