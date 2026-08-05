import { verificarPermissao } from "@/lib/permissions-server";
import { obterExamesParaComparar } from "@/server/actions/medico-actions";
import { CompararExamesClient } from "./comparar-exames-client";

export const dynamic = "force-dynamic";

export default async function CompararExamesPage() {
  await verificarPermissao("medico");
  const exames = await obterExamesParaComparar();

  return (
    <CompararExamesClient
      exames={JSON.parse(JSON.stringify(exames))}
    />
  );
}
