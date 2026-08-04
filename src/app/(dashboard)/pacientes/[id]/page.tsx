import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { PacienteDetalheClient } from "./paciente-detalhe-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PacienteDetalhePage({ params }: PageProps) {
  await verificarPermissao("pacientes");

  const { id } = await params;
  const pacienteId = Number(id);

  if (isNaN(pacienteId)) notFound();

  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
    include: {
      exames: {
        include: {
          tipoExame: true,
          tecnico: true,
          procedencia: true,
          imagens: true,
        },
        orderBy: { dataExame: "desc" },
      },
      _count: { select: { exames: true } },
    },
  });

  if (!paciente) notFound();

  return <PacienteDetalheClient paciente={JSON.parse(JSON.stringify(paciente))} />;
}

