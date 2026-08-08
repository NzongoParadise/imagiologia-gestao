import { verificarPermissao } from "@/lib/permissions-server";
import { PesquisaClient } from "./pesquisa-client";

export const dynamic = "force-dynamic";

export default async function PesquisaPage() {
  await verificarPermissao("cognitivo");
  return <PesquisaClient />;
}
