import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const notificacoes = await prisma.notificacao.findMany({
      take: 50,
      orderBy: { createdAt: "desc" },
      include: {
        exame: { select: { id: true } },
        paciente: { select: { id: true, nome: true } },
      },
    });

    const count = await prisma.notificacao.count({
      where: { lida: false },
    });

    return NextResponse.json({
      notificacoes: notificacoes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      naoLidas: count,
    });
  } catch (error) {
    console.error("Erro ao carregar notificações:", error);
    return NextResponse.json(
      { error: "Erro ao carregar notificações" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, id } = body;

    if (action === "marcar_lida" && id) {
      await prisma.notificacao.update({
        where: { id },
        data: { lida: true },
      });
    } else if (action === "marcar_todas") {
      await prisma.notificacao.updateMany({
        where: { lida: false },
        data: { lida: true },
      });
    } else {
      return NextResponse.json(
        { error: "Ação inválida" },
        { status: 400 }
      );
    }

    // Return updated count
    const naoLidas = await prisma.notificacao.count({
      where: { lida: false },
    });

    return NextResponse.json({ success: true, naoLidas });
  } catch (error) {
    console.error("Erro ao atualizar notificações:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar notificações" },
      { status: 500 }
    );
  }
}

