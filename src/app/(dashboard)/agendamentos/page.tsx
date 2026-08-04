import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { AgendamentosClient } from "./agendamentos-client";

export const dynamic = "force-dynamic";

export default async function AgendamentosPage() {
  await verificarPermissao("agendamentos");

  const [exames, pacientes, tiposExame, tecnicos, procedencias] = await Promise.all([
    prisma.exame.findMany({
      orderBy: { dataExame: "desc" },
      include: {
        paciente: { select: { id: true, nome: true, numeroProcesso: true } },
        tipoExame: { select: { id: true, nome: true, modalidade: true, duracaoMin: true } },
        tecnico: { select: { id: true, nome: true } },
        procedencia: { select: { id: true, nome: true } },
      },
    }),
    prisma.paciente.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, numeroProcesso: true },
    }),
    prisma.tipoExame.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.tecnico.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
    prisma.procedencia.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
    }),
  ]);

  const examesSerialized = exames.map((e) => ({
    ...e,
    dataExame: e.dataExame.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }));

  return (
    <AgendamentosClient
      exames={examesSerialized}
      pacientes={pacientes}
      tiposExame={tiposExame}
      tecnicos={tecnicos}
      procedencias={procedencias}
    />
  );
}
