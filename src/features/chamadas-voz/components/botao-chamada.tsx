"use client";

import { Phone, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { iniciarChamada } from "../actions/chamada-actions";

interface BotaoChamadaProps {
  receptorId: number;
  conversaId?: number;
  variante?: "icone" | "cheio";
  tamanho?: "sm" | "md";
}

export function BotaoChamada({
  receptorId,
  conversaId,
  variante = "icone",
  tamanho = "md",
}: BotaoChamadaProps) {
  const [aChamar, setAChamar] = useState(false);

  async function handleClick() {
    setAChamar(true);
    try {
      await iniciarChamada({ receptorId, conversaId });
      toast.success("Chamada iniciada");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao iniciar chamada";
      toast.error(msg);
    } finally {
      setAChamar(false);
    }
  }

  const tamanhos = {
    sm: "h-8 w-8",
    md: "h-9 w-9",
  };

  if (variante === "icone") {
    return (
      <button
        onClick={handleClick}
        disabled={aChamar}
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-600 hover:bg-green-500/25 hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${tamanhos[tamanho]}`}
        title="Iniciar chamada de voz"
        aria-label="Iniciar chamada de voz"
      >
        {aChamar ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Phone className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={aChamar}
      className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-xs font-medium text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {aChamar ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Phone className="h-3.5 w-3.5" />
      )}
      {aChamar ? "A chamar..." : "Chamada de voz"}
    </button>
  );
}