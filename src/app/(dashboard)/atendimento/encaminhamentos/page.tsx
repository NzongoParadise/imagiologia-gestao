import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { EncaminhamentosClient } from "./encaminhamentos-client";

export const dynamic = "force-dynamic";

export default async function EncaminhamentosPage() {
  await verificarPermissao("atendimento");

const encaminhamentos = await prisma.encaminhamento.findMany({
    orderBy: { criadoEm: "desc" },
    take: 100,
    include: {
      paciente: { select: { id: true, nome: true, numeroProcesso: true } },
      atendimento: { select: { id: true, codigo: true, tipo: true } },
      criadoPor: { select: { id: true, nome: true } },
    },
  });

  return (
    <EncaminhamentosClient
      encaminhamentos={JSON.parse(JSON.stringify(encaminhamentos))}
    />
  );
}
