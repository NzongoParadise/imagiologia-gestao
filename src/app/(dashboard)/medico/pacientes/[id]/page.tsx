import { notFound } from "next/navigation";
import { verificarPermissao } from "@/lib/permissions-server";
import { obterHistoricoPaciente } from "@/server/actions/medico-actions";
import { HistoricoPacienteClient } from "./historico-paciente-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HistoricoPacientePage({ params }: PageProps) {
  await verificarPermissao("medico");
  const { id } = await params;
  const pacienteId = Number(id);

  if (!pacienteId) notFound();

  let dados: Awaited<ReturnType<typeof obterHistoricoPaciente>> | null = null;

  try {
    dados = await obterHistoricoPaciente(pacienteId);
  } catch {
    notFound();
  }

  if (!dados) notFound();

  return (
    <HistoricoPacienteClient
      paciente={JSON.parse(JSON.stringify(dados))}
    />
  );
}
