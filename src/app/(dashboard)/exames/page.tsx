import { listarExames } from "@/server/actions/exames-actions";
import { verificarPermissao } from "@/lib/permissions-server";
import { ExamesClient } from "./exames-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; estado?: string }>;
}

export default async function ExamesPage({ searchParams }: PageProps) {
  await verificarPermissao("exames");

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const estado = params.estado || "";
  const data = await listarExames(page, 20, search, estado);

  return <ExamesClient initialData={data} />;
}

