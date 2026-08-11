import { verificarPermissao } from "@/lib/permissions-server";
import { listarFilaAtendimento } from "@/server/actions/atendimento-actions";
import { FilaAtendimentoClient } from "./fila-atendimento-client";

export const dynamic = "force-dynamic";

export default async function FilaAtendimentoPage() {
  await verificarPermissao("atendimento");
  const fila = await listarFilaAtendimento();
  return <FilaAtendimentoClient fila={JSON.parse(JSON.stringify(fila))} />;
}
