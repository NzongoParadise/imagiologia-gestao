import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy para o backend de IA (TorchXRayVision).
 *
 * O Next.js não consegue correr PyTorch/torchxrayvision em serverless,
 * por isso este endpoint reencaminha o pedido para o serviço Python
 * (variável de ambiente AI_BACKEND_URL).
 *
 * Se AI_BACKEND_URL não estiver definida, devolve um erro claro indicando
 * que o backend de IA não está configurado.
 */

const AI_BACKEND_URL = process.env.AI_BACKEND_URL?.replace(/\/$/, "");

export async function POST(req: NextRequest) {
  if (!AI_BACKEND_URL) {
    return NextResponse.json(
      {
        error:
          "Backend de IA não configurado. Defina a variável de ambiente AI_BACKEND_URL (ex.: https://seu-backend-ia.herokuapp.com).",
      },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();

    // Reencaminha o FormData para o backend de IA
    const resposta = await fetch(`${AI_BACKEND_URL}/api/analisar`, {
      method: "POST",
      body: formData,
      // Não definir Content-Type manualmente: o browser/fetch define o boundary multipart.
      // Precisamos de streaming do body.
      duplex: "half",
    } as RequestInit);

    const dados = await resposta.json();

    if (!resposta.ok) {
      return NextResponse.json(dados, { status: resposta.status });
    }

    return NextResponse.json(dados);
  } catch (err) {
    console.error("Erro ao chamar backend de IA:", err);
    return NextResponse.json(
      {
        error: "Falha ao comunicar com o backend de IA. Verifique se o serviço está online.",
      },
      { status: 502 }
    );
  }
}
