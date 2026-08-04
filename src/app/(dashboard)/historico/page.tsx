import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { HistoricoClient } from "./historico-client";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  await verificarPermissao("historico");

  const historico = await prisma.historico.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      utilizador: { select: { id: true, nome: true } },
      paciente: { select: { id: true, nome: true } },
      exame: { select: { id: true } },
    },
  });

  return <HistoricoClient historico={JSON.parse(JSON.stringify(historico))} />;
}

