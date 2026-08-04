import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { ImagensClient } from "./imagens-client";

export const dynamic = "force-dynamic";

export default async function ImagensPage() {
  await verificarPermissao("imagens");

  const imagens = await prisma.imagem.findMany({
    take: 50,
    orderBy: { createdAt: "desc" },
    include: {
      exame: {
        include: {
          paciente: { select: { id: true, nome: true } },
          tipoExame: { select: { id: true, nome: true } },
          procedencia: { select: { id: true, nome: true } },
        },
      },
    },
  });

  return <ImagensClient imagens={JSON.parse(JSON.stringify(imagens))} />;
}

