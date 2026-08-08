import { verificarPermissao } from "@/lib/permissions-server";
import { obterDadosCognitivoAux } from "@/server/actions/cognitivo-actions";
import { AssistenteClient } from "./assistente-client";

export const dynamic = "force-dynamic";

export default async function AssistentePage() {
  await verificarPermissao("cognitivo");
  const aux = await obterDadosCognitivoAux();

  return (
    <AssistenteClient
      exames={JSON.parse(JSON.stringify(aux.exames))}
    />
  );
}
