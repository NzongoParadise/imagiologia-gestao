import { NextRequest, NextResponse } from "next/server";
import { autorizarApi } from "@/lib/permissions-server";
import {
  obterBackup,
  descomprimir,
  restaurarBackup,
} from "@/features/backup/services/backup-service";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const erro = await autorizarApi("configuracoes", "editar");
  if (erro) return erro;

  try {
    const { id } = await params;
    const backup = await obterBackup(Number(id));
    if (!backup) {
      return NextResponse.json({ error: "Backup não encontrado" }, { status: 404 });
    }

    const dados = descomprimir(Buffer.from(backup.dados));
    await restaurarBackup(dados);

    return NextResponse.json({
      ok: true,
      message: "Base de dados restaurada com sucesso",
      numRegistos: backup.numRegistos,
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
