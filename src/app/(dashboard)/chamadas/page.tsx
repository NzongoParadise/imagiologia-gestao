import { verificarPermissao } from "@/lib/permissions-server";
import { HistoricoChamadasClient } from "./historico-chamadas-client";

export const dynamic = "force-dynamic";

export default async function ChamadasPage() {
  await verificarPermissao("chat");

  return <HistoricoChamadasClient />;
}

