import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { NovoExameForm } from "./novo-exame-form";

export const dynamic = "force-dynamic";

export default async function NovoExamePage() {
  await verificarPermissao("exames", "criar");

  const [pacientes, tiposExame, tecnicos, procedencias, agendamentos] = await Promise.all([
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
    prisma.exame.findMany({
      where: { estado: "Pendente" },
      orderBy: { dataExame: "desc" },
      include: {
        paciente: { select: { id: true, nome: true, numeroProcesso: true } },
        tipoExame: { select: { id: true, nome: true, modalidade: true } },
        tecnico: { select: { id: true, nome: true } },
        procedencia: { select: { id: true, nome: true } },
      },
    }),
  ]);

  const agendamentosSerialized = agendamentos.map((a) => ({
    ...a,
    dataExame: a.dataExame.toISOString(),
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  }));

  return (
    <NovoExameForm
      pacientes={pacientes}
      tiposExame={tiposExame}
      tecnicos={tecnicos}
      procedencias={procedencias}
      agendamentos={agendamentosSerialized}
    />
  );
}

