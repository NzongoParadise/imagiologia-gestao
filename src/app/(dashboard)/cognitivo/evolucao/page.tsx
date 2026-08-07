import { verificarPermissao } from "@/lib/permissions-server";
import { listarComparacoes, obterDadosCognitivoAux } from "@/server/actions/cognitivo-actions";
import { EvolucaoClient } from "./evolucao-client";

export const dynamic = "force-dynamic";

export default async function EvolucaoPage() {
  await verificarPermissao("cognitivo");
  const [comparacoes, aux] = await Promise.all([
    listarComparacoes(),
    obterDadosCognitivoAux(),
  ]);

  return (
    <EvolucaoClient
      comparacoes={JSON.parse(JSON.stringify(comparacoes))}
      exames={JSON.parse(JSON.stringify(aux.exames))}
    />
  );
}
