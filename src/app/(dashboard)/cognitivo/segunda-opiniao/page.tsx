import { verificarPermissao } from "@/lib/permissions-server";
import { obterDadosCognitivoAux, listarSegundasOpinioes } from "@/server/actions/cognitivo-actions";
import { SegundaOpiniaoClient } from "./segunda-opiniao-client";

export const dynamic = "force-dynamic";

export default async function SegundaOpiniaoPage() {
  await verificarPermissao("cognitivo");
  const [aux, opinioes] = await Promise.all([
    obterDadosCognitivoAux(),
    listarSegundasOpinioes(),
  ]);

  return (
    <SegundaOpiniaoClient
      exames={JSON.parse(JSON.stringify(aux.exames))}
      radiologistas={JSON.parse(JSON.stringify(aux.radiologistas))}
      opinioes={JSON.parse(JSON.stringify(opinioes))}
    />
  );
}
