import { verificarPermissao } from "@/lib/permissions-server";
import { listarContradicoes, obterDadosCognitivoAux } from "@/server/actions/cognitivo-actions";
import { ContradicoesClient } from "./contradicoes-client";

export const dynamic = "force-dynamic";

export default async function ContradicoesPage() {
  await verificarPermissao("cognitivo");
  const [contradicoes, aux] = await Promise.all([
    listarContradicoes(),
    obterDadosCognitivoAux(),
  ]);

  return (
    <ContradicoesClient
      contradicoes={JSON.parse(JSON.stringify(contradicoes))}
      exames={JSON.parse(JSON.stringify(aux.exames))}
    />
  );
}
