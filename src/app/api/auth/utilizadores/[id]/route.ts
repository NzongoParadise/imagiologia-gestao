import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hash } from "bcryptjs";
import { autorizarApi } from "@/lib/permissions-server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const erro = await autorizarApi("utilizadores", "editar");
  if (erro) return erro;

  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, email, password, role, ativo } = body;

    const data: Record<string, unknown> = {};
    if (nome !== undefined) data.nome = nome;
    if (email !== undefined) data.email = email;
    if (role !== undefined) data.role = role;
    if (ativo !== undefined) data.ativo = ativo;
    if (password) data.password = await hash(password, 10);

    const utilizador = await prisma.utilizador.update({
      where: { id: Number(id) },
      data,
    });

    return NextResponse.json({
      id: utilizador.id,
      nome: utilizador.nome,
      email: utilizador.email,
      role: utilizador.role,
      ativo: utilizador.ativo,
    });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar utilizador" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const erro = await autorizarApi("utilizadores", "eliminar");
  if (erro) return erro;

  try {
    const { id } = await params;
    await prisma.utilizador.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao eliminar utilizador" }, { status: 500 });
  }
}

