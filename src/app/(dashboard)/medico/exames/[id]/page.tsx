import { notFound } from "next/navigation";
import { verificarPermissao } from "@/lib/permissions-server";
import { obterSolicitacaoMedico, obterLaudo } from "@/server/actions/medico-actions";
import { ExameDetalheClient } from "./exame-detalhe-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExameDetalhePage({ params }: PageProps) {
  await verificarPermissao("medico");
  const { id } = await params;
  const exameId = Number(id);

if (!exameId) notFound();

  let exame: Awaited<ReturnType<typeof obterSolicitacaoMedico>> | null = null;
  let laudo: Awaited<ReturnType<typeof obterLaudo>> | null = null;

  try {
    [exame, laudo] = await Promise.all([
      obterSolicitacaoMedico(exameId),
      obterLaudo(exameId),
    ]);
  } catch {
    notFound();
  }

  if (!exame) notFound();

  return (
    <ExameDetalheClient
      exame={JSON.parse(JSON.stringify(exame))}
      laudo={laudo ? JSON.parse(JSON.stringify(laudo)) : null}
    />
  );
}
