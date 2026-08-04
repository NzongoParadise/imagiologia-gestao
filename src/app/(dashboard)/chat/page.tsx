import { prisma } from "@/lib/db";
import { verificarPermissao } from "@/lib/permissions-server";
import { ChatClient } from "./chat-client";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  await verificarPermissao("chat");

  const [utilizadores] = await Promise.all([
    prisma.utilizador.findMany({
      where: { ativo: true },
      orderBy: { nome: "asc" },
      select: { id: true, nome: true, email: true, role: true },
    }),
  ]);

  const utilizadoresSerialized = utilizadores.map((u) => ({
    ...u,
  }));

  return <ChatClient utilizadores={utilizadoresSerialized} />;
}

