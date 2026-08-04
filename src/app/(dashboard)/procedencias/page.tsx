import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { ProcedenciasClient } from "./procedencias-client";

export const dynamic = "force-dynamic";

export default async function ProcedenciasPage() {
  await verificarPermissao("procedencias");

  const procedencias = await prisma.procedencia.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { exames: true } } },
  });

  return <ProcedenciasClient procedencias={JSON.parse(JSON.stringify(procedencias))} />;
}

