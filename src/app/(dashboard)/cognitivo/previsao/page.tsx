import { verificarPermissao } from "@/lib/permissions-server";
import { PrevisaoClient } from "./previsao-client";

export const dynamic = "force-dynamic";

export default async function PrevisaoPage() {
  await verificarPermissao("cognitivo");
  return <PrevisaoClient />;
}
