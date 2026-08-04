import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { EscalaClient } from "./escala-client";

export const dynamic = "force-dynamic";

export default async function EscalaPage() {
  await verificarPermissao("turnos");

  const [turnos, tecnicos] = await Promise.all([
    prisma.turno.findMany({
      orderBy: [{ data: "asc" }, { horaInicio: "asc" }],
      include: {
        tecnico: { select: { id: true, nome: true, especialidade: true } },
        createdBy: { select: { id: true, nome: true } },
      },
    }),
    prisma.tecnico.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, especialidade: true },
    }),
  ]);

  const turnosSerialized = turnos.map((t) => ({
    ...t,
    data: t.data.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  }));

  return (
    <EscalaClient
      turnos={turnosSerialized}
      tecnicos={tecnicos}
    />
  );
}
