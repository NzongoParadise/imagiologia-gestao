import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { EditarPacienteClient } from "./editar-paciente-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarPacientePage({ params }: PageProps) {
  await verificarPermissao("pacientes", "editar");

  const { id } = await params;
  const pacienteId = Number(id);

  if (isNaN(pacienteId)) notFound();

  const paciente = await prisma.paciente.findUnique({
    where: { id: pacienteId },
  });

  if (!paciente) notFound();

  return <EditarPacienteClient paciente={JSON.parse(JSON.stringify(paciente))} />;
}

