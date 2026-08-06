import { getExamesCount, getExamesPorModalidade, getExamesMensais } from "@/server/actions/exames-actions";
import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  // Se for médico, redireciona para o Portal do Médico
  if (session?.user?.role === "MEDICO") {
    redirect("/medico");
  }

  await verificarPermissao("dashboard");

  const [examesCount, modalidades, examesMensais, ultimosExames, ultimosPacientes, totalPacientes] =
    await Promise.all([
      getExamesCount(),
      getExamesPorModalidade(),
      getExamesMensais(),
      prisma.exame.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          paciente: { select: { id: true, nome: true } },
          tipoExame: { select: { id: true, nome: true, modalidade: true } },
          tecnico: { select: { id: true, nome: true } },
        },
      }),
      prisma.paciente.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { exames: true } } },
      }),
      prisma.paciente.count(),
    ]);

  return (
    <DashboardClient
      examesCount={examesCount}
      modalidades={modalidades}
      examesMensais={examesMensais}
      ultimosExames={JSON.parse(JSON.stringify(ultimosExames))}
      ultimosPacientes={JSON.parse(JSON.stringify(ultimosPacientes))}
      totalPacientes={totalPacientes}
    />
  );
}

