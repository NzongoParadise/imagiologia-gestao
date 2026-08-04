import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { EditarExameClient } from "./editar-exame-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarExamePage({ params }: PageProps) {
  await verificarPermissao("exames", "editar");

  const { id } = await params;
  const exameId = Number(id);

  if (isNaN(exameId)) notFound();

  const exame = await prisma.exame.findUnique({
    where: { id: exameId },
    include: {
      paciente: { select: { id: true, nome: true, numeroProcesso: true } },
      tipoExame: { select: { id: true, nome: true } },
      tecnico: { select: { id: true, nome: true } },
      procedencia: { select: { id: true, nome: true } },
    },
  });

  if (!exame) notFound();

  const [tiposExame, tecnicos, procedencias] = await Promise.all([
    prisma.tipoExame.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.tecnico.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
    prisma.procedencia.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  return (
    <EditarExameClient
      exame={JSON.parse(JSON.stringify(exame))}
      tiposExame={tiposExame}
      tecnicos={tecnicos}
      procedencias={procedencias}
    />
  );
}

