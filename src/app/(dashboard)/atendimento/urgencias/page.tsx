import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { UrgenciasClient } from "./urgencias-client";

export const dynamic = "force-dynamic";

export default async function UrgenciasPage() {
  await verificarPermissao("atendimento");

  const [bancosUrgencia, classificacoesRisco, pacientes, atendimentos] = await Promise.all([
    prisma.bancoUrgencia.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.classificacaoRisco.findMany({
      where: { ativo: true },
      orderBy: { nivel: "desc" },
    }),
    prisma.paciente.findMany({
      orderBy: { nome: "asc" },
      take: 100,
      select: { id: true, nome: true, numeroProcesso: true },
    }),
    prisma.atendimento.findMany({
      where: { tipo: "URGENCIA" },
      orderBy: { criadoEm: "desc" },
      take: 100,
      include: {
        paciente: { select: { id: true, nome: true, numeroProcesso: true } },
        urgencia: {
          include: {
            bancoUrgencia: { select: { id: true, nome: true, tipo: true } },
            classificacao: { select: { id: true, nome: true, cor: true, nivel: true } },
            medico: { select: { id: true, nome: true } },
          },
        },
        triagem: {
          include: { classificacao: { select: { id: true, nome: true, cor: true, nivel: true } } },
        },
      },
    }),
  ]);

  return (
    <UrgenciasClient
      bancosUrgencia={JSON.parse(JSON.stringify(bancosUrgencia))}
      classificacoesRisco={JSON.parse(JSON.stringify(classificacoesRisco))}
      pacientes={JSON.parse(JSON.stringify(pacientes))}
      atendimentos={JSON.parse(JSON.stringify(atendimentos))}
    />
  );
}
