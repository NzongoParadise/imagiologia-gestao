import { verificarPermissao } from "@/lib/permissions-server";
import { ConfiguracoesClient } from "./configuracoes-client";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  await verificarPermissao("configuracoes");

  return <ConfiguracoesClient />;
}

