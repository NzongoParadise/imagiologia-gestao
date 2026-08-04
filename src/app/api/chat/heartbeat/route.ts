import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const userId = Number(session.user.id);

    await prisma.utilizador.update({
      where: { id: userId },
      data: { ultimoVisto: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar heartbeat:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar heartbeat" },
      { status: 500 }
    );
  }
}
