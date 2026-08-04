import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const userId = Number(session.user.id);

    const conversas = await prisma.conversa.findMany({
      where: {
        participantes: { some: { utilizadorId: userId } },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
participantes: {
          include: {
            utilizador: { select: { id: true, nome: true, ultimoVisto: true } },
          },
        },
        mensagens: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            utilizador: { select: { id: true, nome: true } },
          },
        },
      },
    });

    const resultado = await Promise.all(
      conversas.map(async (c) => {
        const meuParticipante = c.participantes.find(
          (p) => p.utilizadorId === userId
        );
        const lidaEm = meuParticipante?.lidaEm ?? null;

        const naoLidas = await prisma.mensagem.count({
          where: {
            conversaId: c.id,
            utilizadorId: { not: userId },
            createdAt: lidaEm ? { gt: lidaEm } : undefined,
          },
        });

        const outros = c.participantes
          .filter((p) => p.utilizadorId !== userId)
          .map((p) => p.utilizador.nome);

        return {
          id: c.id,
          titulo: c.titulo,
          tituloDisplay:
            c.titulo || outros.join(", ") || "Conversa sem título",
          ultimaMensagem: c.mensagens[0]
            ? {
                id: c.mensagens[0].id,
                conteudo: c.mensagens[0].conteudo,
                createdAt: c.mensagens[0].createdAt.toISOString(),
                utilizador: c.mensagens[0].utilizador,
              }
            : null,
          naoLidas,
          participantes: c.participantes.map((p) => ({
            utilizador: p.utilizador,
          })),
        };
      })
    );

    return NextResponse.json({ conversas: resultado });
  } catch (error) {
    console.error("Erro ao carregar conversas:", error);
    return NextResponse.json(
      { error: "Erro ao carregar conversas" },
      { status: 500 }
    );
  }
}
