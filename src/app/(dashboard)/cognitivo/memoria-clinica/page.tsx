import { verificarPermissao } from "@/lib/permissions-server";
import { obterDadosCognitivoAux } from "@/server/actions/cognitivo-actions";
import { MemoriaClinicaClient } from "./memoria-clinica-client";

export const dynamic = "force-dynamic";

export default async function MemoriaClinicaPage() {
  await verificarPermissao("cognitivo");
  const aux = await obterDadosCognitivoAux();

  return (
    <MemoriaClinicaClient
      regioes={JSON.parse(JSON.stringify(aux.regioes))}
      tiposExame={JSON.parse(JSON.stringify(aux.tiposExame))}
    />
  );
}

