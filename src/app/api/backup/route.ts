import { NextRequest, NextResponse } from "next/server";
import { autorizarApi } from "@/lib/permissions-server";
import {
  recolherDados,
  comprimir,
  guardarBackup,
  listarBackups,
  aplicarRetencao,
  dadosParaDownload,
} from "@/features/backup/services/backup-service";
import { auth } from "@/lib/auth";

export async function GET() {
  const erro = await autorizarApi("configuracoes");
  if (erro) return erro;

  try {
    const backups = await listarBackups();
    return NextResponse.json(backups);
  } catch (error) {
    console.error("Erro ao listar backups:", error);
    return NextResponse.json({ error: "Erro ao listar backups" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const erro = await autorizarApi("configuracoes", "criar");
  if (erro) return erro;

  try {
    const session = await auth();
    const userId = (session?.user?.id as unknown as number) ?? null;

    const dados = await recolherDados();
    const dadosBuffer = comprimir(dados);
    const numRegistos = Object.values(dados.conteudo).reduce(
      (acc, arr) => acc + arr.length,
      0
    );

    const backup = await guardarBackup({
      dados: dadosBuffer,
      tipo: "manual",
      criadoPorId: userId,
      numRegistos,
    });

    // Aplicar retenção após criar backup manual
    await aplicarRetencao();

// Devolver o backup com os dados em JSON plano (descomprimido) para download
    const downloadBuffer = dadosParaDownload(dadosBuffer);
    return NextResponse.json({
      id: backup.id,
      nome: backup.nome,
      tipo: backup.tipo,
      tamanho: backup.tamanho,
      numRegistos: backup.numRegistos,
      criadoEm: backup.criadoEm,
      dadosBase64: downloadBuffer.toString("base64"),
    });
  } catch (error) {
    console.error("Erro ao criar backup:", error);
    return NextResponse.json({ error: "Erro ao criar backup" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
