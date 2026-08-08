// ---------------------------------------------------------------------------
// Serviço de IA Google Gemini
//
// Centraliza o acesso à API do Google Gemini (generateContent) para uso em
// todos os módulos que precisam de IA generativa (texto).
//
// NOTA: A chave deve estar na variável de ambiente GEMINI_API_KEY.
// Modelo padrão: gemini-2.0-flash (rápido e acessível). Pode ser alterado
// via GEMINI_MODEL.
//
// ⚠️ Segurança clínica: os resultados são APOIO à decisão. O diagnóstico
// definitivo pertence sempre ao médico especialista.
// ---------------------------------------------------------------------------

const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const GEMINI_MODEL = process.env.GEMINI_MODEL?.trim() || "gemini-2.0-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export interface GeminiMensagem {
  role: "user" | "model";
  parts: { text: string }[];
}

/**
 * Envia um pedido de texto ao modelo Gemini e devolve a resposta em texto.
 * Lança erro se a API não estiver configurada ou falhar.
 */
export async function gerarComGemini(
  prompt: string,
  systemInstruction?: string,
  opcoes?: { temperatura?: number; maxOutputTokens?: number }
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY não configurada. Defina a variável de ambiente (ex.: .env.local)."
    );
  }

  const contents: GeminiMensagem[] = [{ role: "user", parts: [{ text: prompt }] }];

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: opcoes?.temperatura ?? 0.4,
      maxOutputTokens: opcoes?.maxOutputTokens ?? 2048,
    },
  };

  if (systemInstruction && systemInstruction.trim()) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const url = `${GEMINI_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
    GEMINI_API_KEY
  )}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      let detalhe = "";
      try {
        const err = await res.json();
        detalhe = err?.error?.message || JSON.stringify(err);
      } catch {
        detalhe = await res.text();
      }
      throw new Error(`Gemini API erro ${res.status}: ${detalhe}`);
    }

    const dados = await res.json();
    const texto = dados?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || "")
      .join("");

    if (!texto) {
      throw new Error("Gemini API devolveu resposta vazia ou com bloqueio de segurança.");
    }

    return texto.trim();
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Gemini API erro")) {
      throw err;
    }
    throw new Error(`Falha ao comunicar com o Gemini: ${err instanceof Error ? err.message : err}`);
  }
}

/**
 * Verifica se a chave Gemini está configurada (sem fazer chamadas de rede).
 */
export function geminiConfigurado(): boolean {
  return Boolean(GEMINI_API_KEY);
}
