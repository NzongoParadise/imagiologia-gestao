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
      select: {
        id: true,
        participantes: {
          where: { utilizadorId: userId },
          select: { lidaEm: true },
        },
      },
    });

    let totalNaoLidas = 0;
    for (const c of conversas) {
      const lidaEm = c.participantes[0]?.lidaEm ?? null;
      const count = await prisma.mensagem.count({
        where: {
          conversaId: c.id,
          utilizadorId: { not: userId },
          createdAt: lidaEm ? { gt: lidaEm } : undefined,
        },
      });
      totalNaoLidas += count;
    }

    return NextResponse.json({ totalNaoLidas });
  } catch (error) {
    console.error("Erro ao contar mensagens não lidas:", error);
    return NextResponse.json(
      { error: "Erro ao contar mensagens não lidas" },
      { status: 500 }
    );
  }
}
