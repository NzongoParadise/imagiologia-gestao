import { NextRequest, NextResponse } from "next/server";
import { autorizarApi } from "@/lib/permissions-server";
import { BACKUP_VERSION, restaurarBackup } from "@/features/backup/services/backup-service";

export async function POST(request: NextRequest) {
  const erro = await autorizarApi("configuracoes", "editar");
  if (erro) return erro;

  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Nenhum ficheiro enviado" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const texto = buffer.toString("utf-8");

    // Aceitar JSON direto do download (sem gzip) — o backup descarregado é JSON plano
    let parsed: unknown;
    try {
      parsed = JSON.parse(texto);
    } catch {
      return NextResponse.json(
        { error: "Ficheiro inválido. Envie um backup JSON exportado pelo sistema." },
        { status: 400 }
      );
    }

const dados = parsed as {
      versao: number;
      exportadoEm: string;
      conteudo: Record<string, unknown[]>;
    };

    if (!dados || dados.versao !== BACKUP_VERSION || !dados.conteudo) {
      return NextResponse.json(
        { error: "Versão de backup não suportada ou ficheiro inválido" },
        { status: 400 }
      );
    }

    await restaurarBackup(dados);

    const numRegistos = Object.values(dados.conteudo).reduce(
      (acc, arr) => acc + arr.length,
      0
    );

    return NextResponse.json({
      ok: true,
      message: "Base de dados restaurada com sucesso",
      numRegistos,
    });
  } catch (error) {
    console.error("Erro ao restaurar backup:", error);
    const msg = error instanceof Error ? error.message : "Erro ao restaurar backup";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
