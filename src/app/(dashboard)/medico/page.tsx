import { verificarPermissao } from "@/lib/permissions-server";
import { obterIndicadoresMedico } from "@/server/actions/medico-actions";
import { MedicoDashboardClient } from "./medico-dashboard-client";

export const dynamic = "force-dynamic";

export default async function MedicoDashboardPage() {
  await verificarPermissao("medico");
  const indicadores = await obterIndicadoresMedico();

  return (
    <MedicoDashboardClient
      indicadores={JSON.parse(JSON.stringify(indicadores))}
    />
  );
}
