import { verificarPermissao } from "@/lib/permissions-server";
import { listarSessoesIA } from "@/server/actions/cognitivo-actions";
import { IaGenerativaClient } from "./ia-generativa-client";

export const dynamic = "force-dynamic";

export default async function IaGenerativaPage() {
  await verificarPermissao("cognitivo");
  const sessoes = await listarSessoesIA();
  return (
    <IaGenerativaClient
      sessoes={JSON.parse(JSON.stringify(sessoes))}
    />
  );
}
