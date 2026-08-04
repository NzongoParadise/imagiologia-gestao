import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { DetalheExameClient } from "./detalhe-exame-client";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DetalheExamePage({ params }: PageProps) {
  await verificarPermissao("exames");

  const { id } = await params;
  const exameId = Number(id);

  if (isNaN(exameId)) notFound();

  const exame = await prisma.exame.findUnique({
    where: { id: exameId },
    include: {
      paciente: true,
      tipoExame: true,
      tecnico: true,
      procedencia: true,
      imagens: { orderBy: { createdAt: "desc" } },
      realizadoPor: { select: { id: true, nome: true } },
    },
  });

  if (!exame) notFound();

  return <DetalheExameClient exame={JSON.parse(JSON.stringify(exame))} />;
}

