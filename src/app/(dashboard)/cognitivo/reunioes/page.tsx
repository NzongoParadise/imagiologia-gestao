import { verificarPermissao } from "@/lib/permissions-server";
import { obterDadosCognitivoAux, listarReunioes } from "@/server/actions/cognitivo-actions";
import { ReunioesClient } from "./reunioes-client";

export const dynamic = "force-dynamic";

export default async function ReunioesPage() {
  await verificarPermissao("cognitivo");
  const [aux, reunioes] = await Promise.all([
    obterDadosCognitivoAux(),
    listarReunioes(),
  ]);

  return (
    <ReunioesClient
      pacientes={JSON.parse(JSON.stringify(aux.pacientes))}
      exames={JSON.parse(JSON.stringify(aux.exames))}
      utilizadores={JSON.parse(JSON.stringify(aux.radiologistas))}
      reunioes={JSON.parse(JSON.stringify(reunioes))}
    />
  );
}
