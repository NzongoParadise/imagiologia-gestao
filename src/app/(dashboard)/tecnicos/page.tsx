import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { TecnicosClient } from "./tecnicos-client";

export const dynamic = "force-dynamic";

export default async function TecnicosPage() {
  await verificarPermissao("tecnicos");

  const tecnicos = await prisma.tecnico.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { exames: true } } },
  });

  return <TecnicosClient tecnicos={JSON.parse(JSON.stringify(tecnicos))} />;
}

