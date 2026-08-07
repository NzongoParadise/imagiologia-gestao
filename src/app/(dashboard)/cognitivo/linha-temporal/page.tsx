import { verificarPermissao } from "@/lib/permissions-server";
import { obterDadosCognitivoAux } from "@/server/actions/cognitivo-actions";
import { LinhaTemporalClient } from "./linha-temporal-client";

export const dynamic = "force-dynamic";

export default async function LinhaTemporalPage() {
  await verificarPermissao("cognitivo");
  const dados = await obterDadosCognitivoAux();

  return (
    <LinhaTemporalClient
      pacientes={JSON.parse(JSON.stringify(dados.pacientes))}
    />
  );
}
