import { verificarPermissao } from "@/lib/permissions-server";
import { RelatoriosClient } from "./relatorios-client";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  await verificarPermissao("atendimento");

  return <RelatoriosClient />;
}
