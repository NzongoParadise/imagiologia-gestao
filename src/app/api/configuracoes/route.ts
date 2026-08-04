import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { autorizarApi } from "@/lib/permissions-server";

export async function GET() {
  const erro = await autorizarApi("configuracoes");
  if (erro) return erro;

  try {
    const configuracoes = await prisma.configuracao.findMany();
    const configMap: Record<string, string> = {};
    configuracoes.forEach((c) => {
      configMap[c.chave] = c.valor;
    });
    return NextResponse.json(configMap);
  } catch (error) {
    console.error("Erro ao carregar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao carregar configurações" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const erro = await autorizarApi("configuracoes", "editar");
  if (erro) return erro;

  try {
    const body: Record<string, string> = await request.json();

    // Upsert each configuration key-value pair
    const operations = Object.entries(body).map(([chave, valor]) =>
      prisma.configuracao.upsert({
        where: { chave },
        update: { valor: String(valor) },
        create: { chave, valor: String(valor) },
      })
    );

    await prisma.$transaction(operations);

    // Return updated config
    const configuracoes = await prisma.configuracao.findMany();
    const configMap: Record<string, string> = {};
    configuracoes.forEach((c) => {
      configMap[c.chave] = c.valor;
    });

    return NextResponse.json(configMap);
  } catch (error) {
    console.error("Erro ao guardar configurações:", error);
    return NextResponse.json(
      { error: "Erro ao guardar configurações" },
      { status: 500 }
    );
  }
}
