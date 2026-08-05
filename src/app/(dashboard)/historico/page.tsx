import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { HistoricoClient } from "./historico-client";

export const dynamic = "force-dynamic";

export default async function HistoricoPage() {
  await verificarPermissao("historico");

  const [historico, total, porAcao, porEntidade, utilizadoresAtivos] = await Promise.all([
    prisma.historico.findMany({
      take: 200,
      orderBy: { createdAt: "desc" },
      include: {
        utilizador: { select: { id: true, nome: true, email: true } },
        paciente: { select: { id: true, nome: true } },
        exame: { select: { id: true } },
      },
    }),
    prisma.historico.count(),
    prisma.historico.groupBy({
      by: ["acao"],
      _count: { _all: true },
    }),
    prisma.historico.groupBy({
      by: ["entidade"],
      _count: { _all: true },
    }),
    prisma.utilizador.count({ where: { ativo: true } }),
  ]);

  return (
    <HistoricoClient
      historico={JSON.parse(JSON.stringify(historico))}
      total={total}
      porAcao={JSON.parse(JSON.stringify(porAcao))}
      porEntidade={JSON.parse(JSON.stringify(porEntidade))}
      utilizadoresAtivos={utilizadoresAtivos}
    />
  );
}