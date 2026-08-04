import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { autorizarApi } from "@/lib/permissions-server";

export async function GET() {
  const erro = await autorizarApi("utilizadores");
  if (erro) return erro;

  const utilizadores = await prisma.utilizador.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true, email: true, role: true, ativo: true, createdAt: true },
  });
  return NextResponse.json(utilizadores);
}

export async function POST(request: Request) {
  const erro = await autorizarApi("utilizadores", "criar");
  if (erro) return erro;

  try {
    const body = await request.json();
    const { nome, email, password, role, ativo } = body;

    const existing = await prisma.utilizador.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email já registado" }, { status: 400 });
    }

    const hashedPassword = await hash(password || "temp123", 10);
    const utilizador = await prisma.utilizador.create({
      data: {
        nome,
        email,
        password: hashedPassword,
        role: role || "TECNICO",
        ativo: ativo !== false,
      },
    });

    return NextResponse.json({
      id: utilizador.id,
      nome: utilizador.nome,
      email: utilizador.email,
      role: utilizador.role,
      ativo: utilizador.ativo,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao criar utilizador" }, { status: 500 });
  }
}

