import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Não autenticado", { status: 401 });
    }

    const url = new URL(request.url);
    const especialidadeId = url.searchParams.get("especialidadeId");

    const where: any = { ativo: true };

    if (especialidadeId) {
      where.especialidadeId = parseInt(especialidadeId);
    }

    const consultórios = await prisma.consultorio.findMany({
      where,
      select: {
        id: true,
        numero: true,
        nome: true,
        especialidade: {
          select: {
            id: true,
            nome: true,
          },
        },
        capacidade: true,
      },
      orderBy: {
        numero: "asc",
      },
    });

    return Response.json(consultórios);
  } catch (error) {
    console.error("Erro ao obter consultórios:", error);
    return new Response("Erro ao obter consultórios", { status: 500 });
  }
}
