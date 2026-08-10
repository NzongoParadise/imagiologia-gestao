import { verificarPermissao } from "@/lib/permissions-server";
import { obterDashboardAtendimento } from "@/server/actions/atendimento-actions";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AtendimentoDashboardPage() {
  await verificarPermissao("atendimento");

  const dashboard = await obterDashboardAtendimento();

  return <DashboardClient dashboard={JSON.parse(JSON.stringify(dashboard))} />;
}
