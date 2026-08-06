import { verificarPermissao } from "@/lib/permissions-server";
import { obterDadosDiagnosticoIA } from "@/server/actions/medico-actions";
import { DiagnosticoIAClient } from "./diagnostico-ia-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function DiagnosticoIAPage({ params }: PageProps) {
  await verificarPermissao("medico");

  const { id } = await params;
  const exameId = Number(id);
  if (!exameId || Number.isNaN(exameId)) {
    return <p className="text-center text-muted-foreground">ID de exame inválido</p>;
  }

  const dados = await obterDadosDiagnosticoIA(exameId);

  return (
    <DiagnosticoIAClient
      exame={dados.exame}
      analises={dados.analises}
      examesAnteriores={dados.examesAnteriores}
    />
  );
}
