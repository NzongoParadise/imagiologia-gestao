"use client";

import { useState } from "react";
import { cn } from "@/utils/cn";
import { Flame, Layers, Scan } from "lucide-react";

interface HeatmapViewerProps {
  imageUrl: string;
  heatmapUrl?: string | null;
  regioes?: Array<{
    x: number;
    y: number;
    largura: number;
    altura: number;
    tipo: string;
    confianca: number;
  }>;
  className?: string;
}

type ModoVisualizacao = "original" | "heatmap" | "sobreposicao";

export function HeatmapViewer({
  imageUrl,
  heatmapUrl,
  regioes = [],
  className,
}: HeatmapViewerProps) {
  const [modo, setModo] = useState<ModoVisualizacao>("original");
  const temHeatmap = Boolean(heatmapUrl);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Tabs de visualização */}
      <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
        <button
          onClick={() => setModo("original")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            modo === "original" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          Original
        </button>
        <button
          onClick={() => setModo("heatmap")}
          disabled={!temHeatmap}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
            modo === "heatmap" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Flame className="h-3.5 w-3.5" />
          Heatmap
        </button>
        <button
          onClick={() => setModo("sobreposicao")}
          disabled={!temHeatmap}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
            modo === "sobreposicao" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Scan className="h-3.5 w-3.5" />
          Sobreposição
        </button>
      </div>

      {/* Imagem */}
      <div className="relative aspect-square overflow-hidden rounded-lg border bg-black">
        {modo === "sobreposicao" && heatmapUrl ? (
          <div className="relative h-full w-full">
            <img src={imageUrl} alt="Imagem original" className="h-full w-full object-contain" />
            <img
              src={heatmapUrl}
              alt="Heatmap Grad-CAM"
              className="absolute inset-0 h-full w-full object-contain mix-blend-multiply opacity-70"
            />
          </div>
        ) : (
          <img
            src={modo === "heatmap" && heatmapUrl ? heatmapUrl : imageUrl}
            alt={modo === "heatmap" ? "Heatmap Grad-CAM" : "Imagem do exame"}
            className="h-full w-full object-contain"
          />
        )}

        {/* Regiões de interesse */}
        {(modo === "original" || modo === "sobreposicao") &&
          regioes.length > 0 && (
            <div className="absolute inset-0">
              {regioes.map((r, i) => (
                <div
                  key={i}
                  className="absolute border-2 border-yellow-400 bg-yellow-400/10"
                  style={{
                    left: `${r.x * 100}%`,
                    top: `${r.y * 100}%`,
                    width: `${r.largura * 100}%`,
                    height: `${r.altura * 100}%`,
                  }}
                  title={`${r.tipo} (${Math.round(r.confianca)}%)`}
                />
              ))}
            </div>
          )}
      </div>

      {!temHeatmap && (
        <p className="text-center text-xs text-muted-foreground">
          Heatmap Grad-CAM não disponível para esta análise.
        </p>
      )}
    </div>
  );
}
