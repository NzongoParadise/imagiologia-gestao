import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { UtilizadoresClient } from "./utilizadores-client";

export const dynamic = "force-dynamic";

export default async function UtilizadoresPage() {
  await verificarPermissao("utilizadores");

  const utilizadores = await prisma.utilizador.findMany({
    orderBy: { nome: "asc" },
  });

  return <UtilizadoresClient utilizadores={JSON.parse(JSON.stringify(utilizadores))} />;
}

