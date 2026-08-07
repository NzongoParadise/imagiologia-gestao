import { verificarPermissao } from "@/lib/permissions-server";
import { listarComparacoes, obterDadosCognitivoAux } from "@/server/actions/cognitivo-actions";
import { DetectorMudancasClient } from "./detector-mudancas-client";

export const dynamic = "force-dynamic";

export default async function DetectorMudancasPage() {
  await verificarPermissao("cognitivo");
  const [comparacoes, aux] = await Promise.all([
    listarComparacoes(),
    obterDadosCognitivoAux(),
  ]);

  return (
    <DetectorMudancasClient
      comparacoes={JSON.parse(JSON.stringify(comparacoes))}
      pacientes={JSON.parse(JSON.stringify(aux.pacientes))}
      exames={JSON.parse(JSON.stringify(aux.exames))}
    />
  );
}
