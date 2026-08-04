import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { TiposExameClient } from "./tipos-exame-client";

export const dynamic = "force-dynamic";

export default async function TiposExamePage() {
  await verificarPermissao("tipos-exame");

  const tiposExame = await prisma.tipoExame.findMany({
    orderBy: { nome: "asc" },
    include: { _count: { select: { exames: true } } },
  });

  return <TiposExameClient tiposExame={JSON.parse(JSON.stringify(tiposExame))} />;
}

