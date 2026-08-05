import { NextRequest, NextResponse } from "next/server";
import { autorizarApi } from "@/lib/permissions-server";
import { obterBackup, apagarBackup, dadosParaDownload } from "@/features/backup/services/backup-service";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const erro = await autorizarApi("configuracoes");
  if (erro) return erro;

  try {
    const { id } = await params;
    const backup = await obterBackup(Number(id));
    if (!backup) {
      return NextResponse.json({ error: "Backup não encontrado" }, { status: 404 });
    }

// Devolver metadados + dados em JSON plano (descomprimido) para download/restauro
    const json = dadosParaDownload(backup.dados);
    return NextResponse.json({
      id: backup.id,
      nome: backup.nome,
      tipo: backup.tipo,
      tamanho: backup.tamanho,
      numRegistos: backup.numRegistos,
      criadoEm: backup.criadoEm,
      dadosBase64: json.toString("base64"),
    });
  } catch (error) {
    console.error("Erro ao obter backup:", error);
    return NextResponse.json({ error: "Erro ao obter backup" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const erro = await autorizarApi("configuracoes", "eliminar");
  if (erro) return erro;

  try {
    const { id } = await params;
    await apagarBackup(Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Erro ao apagar backup:", error);
    return NextResponse.json({ error: "Erro ao apagar backup" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
