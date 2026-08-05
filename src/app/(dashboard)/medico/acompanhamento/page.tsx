import { verificarPermissao } from "@/lib/permissions-server";
import { listarSolicitacoesMedico } from "@/server/actions/medico-actions";
import { AcompanhamentoClient } from "./acompanhamento-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    estado?: string;
    prioridade?: string;
  }>;
}

export default async function AcompanhamentoPage({ searchParams }: PageProps) {
  await verificarPermissao("medico");
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const estado = params.estado || "";
  const prioridade = params.prioridade || "";

  const data = await listarSolicitacoesMedico(page, 20, search, estado, prioridade);

  return <AcompanhamentoClient initialData={JSON.parse(JSON.stringify(data))} />;
}
