import { NextRequest, NextResponse } from "next/server";
import { executarBackupAutomatico } from "@/features/backup/services/backup-service";

export async function GET(request: NextRequest) {
  // Proteger o endpoint cron com CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const resultado = await executarBackupAutomatico();
    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro no backup automático:", error);
    const msg = error instanceof Error ? error.message : "Erro no backup automático";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
