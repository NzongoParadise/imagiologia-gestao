import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { ConsultasClient } from "./consultas-client";

export const dynamic = "force-dynamic";

export default async function ConsultasPage() {
  await verificarPermissao("atendimento");

  const [especialidades, pacientes, atendimentos] = await Promise.all([
    prisma.especialidade.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.paciente.findMany({
      orderBy: { nome: "asc" },
      take: 100,
      select: { id: true, nome: true, numeroProcesso: true },
    }),
    prisma.atendimento.findMany({
      where: { tipo: "CONSULTA" },
      orderBy: { criadoEm: "desc" },
      take: 100,
      include: {
        paciente: { select: { id: true, nome: true, numeroProcesso: true } },
        especialidade: { select: { id: true, nome: true } },
        consulta: {
          include: { medico: { select: { id: true, nome: true } } },
        },
        criadoPor: { select: { id: true, nome: true } },
      },
    }),
  ]);

  return (
    <ConsultasClient
      especialidades={JSON.parse(JSON.stringify(especialidades))}
      pacientes={JSON.parse(JSON.stringify(pacientes))}
      atendimentos={JSON.parse(JSON.stringify(atendimentos))}
    />
  );
}
