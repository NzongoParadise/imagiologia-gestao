import { verificarPermissao } from "@/lib/permissions-server";
import { obterRegioesComExames, obterDadosCognitivoAux } from "@/server/actions/cognitivo-actions";
import { DigitalTwinClient } from "./digital-twin-client";

export const dynamic = "force-dynamic";

export default async function DigitalTwinPage() {
  await verificarPermissao("cognitivo");
  const [regioes, aux] = await Promise.all([
    obterRegioesComExames(),
    obterDadosCognitivoAux(),
  ]);

  return (
    <DigitalTwinClient
      regioes={JSON.parse(JSON.stringify(regioes))}
      exames={JSON.parse(JSON.stringify(aux.exames))}
    />
  );
}
