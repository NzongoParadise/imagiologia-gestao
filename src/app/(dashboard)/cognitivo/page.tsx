import { verificarPermissao } from "@/lib/permissions-server";
import { obterDashboardCognitivo } from "@/server/actions/cognitivo-actions";
import { CognitivoDashboardClient } from "./cognitivo-dashboard-client";

export const dynamic = "force-dynamic";

export default async function CognitivoDashboardPage() {
  await verificarPermissao("cognitivo");
  const dados = await obterDashboardCognitivo();

  return (
    <CognitivoDashboardClient
      dados={JSON.parse(JSON.stringify(dados))}
    />
  );
}
