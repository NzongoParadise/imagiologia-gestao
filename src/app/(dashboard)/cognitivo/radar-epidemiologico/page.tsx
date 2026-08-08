import { verificarPermissao } from "@/lib/permissions-server";
import { RadarEpidemiologicoClient } from "./radar-epidemiologico-client";

export const dynamic = "force-dynamic";

export default async function RadarEpidemiologicoPage() {
  await verificarPermissao("cognitivo");
  return <RadarEpidemiologicoClient />;
}
