import { prisma } from "@/lib/db";
import { autorizar } from "@/lib/permissions-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await autorizar("pacientes", "ver");

    const searchParams = request.nextUrl.searchParams;
    const termo = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;

    if (termo.length < 2) {
      return NextResponse.json({
        data: [],
        total: 0,
        pages: 0,
        page,
      });
    }

    const skip = (page - 1) * limit;

    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { numeroProcesso: { contains: termo, mode: "insensitive" } },
            { nif: { contains: termo } },
            { bi: { contains: termo } },
          ],
        },
        select: {
          id: true,
          nome: true,
          numeroProcesso: true,
          dataNascimento: true,
          telefone: true,
        },
        orderBy: { nome: "asc" },
        skip,
        take: limit,
      }),
      prisma.paciente.count({
        where: {
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { numeroProcesso: { contains: termo, mode: "insensitive" } },
            { nif: { contains: termo } },
            { bi: { contains: termo } },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      data: pacientes,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pacientes" },
      { status: 500 }
    );
  }
}