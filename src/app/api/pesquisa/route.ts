import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (q.length < 2) {
    return NextResponse.json({ resultados: [] });
  }

  try {
    const [pacientes, exames, tecnicos, procedencias, tiposExame] =
      await Promise.all([
        prisma.paciente.findMany({
          where: {
            OR: [
              { nome: { contains: q } },
              { numeroProcesso: { contains: q } },
              { nif: { contains: q } },
              { bi: { contains: q } },
              { telefone: { contains: q } },
              { email: { contains: q } },
            ],
          },
          take: 5,
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, numeroProcesso: true },
        }),
        prisma.exame.findMany({
          where: {
            OR: [
              { codigo: { contains: q } },
              { medicoSolicitante: { contains: q } },
              { observacao: { contains: q } },
              { estado: { contains: q } },
              { paciente: { nome: { contains: q } } },
              { tipoExame: { nome: { contains: q } } },
            ],
          },
          take: 5,
          orderBy: { dataExame: "desc" },
          select: {
            id: true,
            codigo: true,
            estado: true,
            dataExame: true,
            paciente: { select: { id: true, nome: true } },
            tipoExame: { select: { nome: true } },
          },
        }),
        prisma.tecnico.findMany({
          where: {
            OR: [
              { nome: { contains: q } },
              { especialidade: { contains: q } },
              { email: { contains: q } },
              { telefone: { contains: q } },
            ],
          },
          take: 5,
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, especialidade: true },
        }),
        prisma.procedencia.findMany({
          where: {
            OR: [{ nome: { contains: q } }, { descricao: { contains: q } }],
          },
          take: 5,
          orderBy: { nome: "asc" },
          select: { id: true, nome: true },
        }),
        prisma.tipoExame.findMany({
          where: {
            OR: [
              { nome: { contains: q } },
              { modalidade: { contains: q } },
              { descricao: { contains: q } },
            ],
          },
          take: 5,
          orderBy: { nome: "asc" },
          select: { id: true, nome: true, modalidade: true },
        }),
      ]);

    return NextResponse.json({
      resultados: {
        pacientes,
        exames: exames.map((e) => ({
          ...e,
          dataExame: e.dataExame.toISOString(),
        })),
        tecnicos,
        procedencias,
        tiposExame,
      },
    });
  } catch (error) {
    console.error("Erro na pesquisa global:", error);
    return NextResponse.json(
      { error: "Erro na pesquisa" },
      { status: 500 }
    );
  }
}
