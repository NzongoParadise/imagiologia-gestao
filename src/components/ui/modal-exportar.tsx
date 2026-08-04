"use client";

import { useState } from "react";
import { FileText, FileSpreadsheet, FileDown, X, Loader2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { exportarPDF, exportarExcel, exportarWord } from "@/features/relatorios/services/exportar-relatorio";
import type { RelatorioPeriodo } from "@/server/actions/relatorios-actions";

interface ModalExportarProps {
  open: boolean;
  onClose: () => void;
  relatorio: RelatorioPeriodo;
  filtros: {
    dataInicio: string;
    dataFim: string;
    estado?: string;
    procedencia?: string;
    tecnico?: string;
    modalidade?: string;
  };
}

type FormatoExportacao = "pdf" | "excel" | "word";

const FORMATOS: {
  formato: FormatoExportacao;
  titulo: string;
  descricao: string;
  icone: React.ElementType;
  cor: string;
  corBg: string;
}[] = [
  {
    formato: "pdf",
    titulo: "PDF",
    descricao: "Documento profissional formatado com tabelas e gráficos, ideal para apresentação e impressão.",
    icone: FileText,
    cor: "text-red-600",
    corBg: "bg-red-50 border-red-200 hover:bg-red-100",
  },
  {
    formato: "excel",
    titulo: "Excel",
    descricao: "Planilha com múltiplas abas organizadas por categoria, ideal para análise de dados.",
    icone: FileSpreadsheet,
    cor: "text-emerald-600",
    corBg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  },
  {
    formato: "word",
    titulo: "Word",
    descricao: "Documento editável com secções e tabelas formatadas, ideal para relatórios personalizados.",
    icone: FileDown,
    cor: "text-blue-600",
    corBg: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
];

export function ModalExportar({ open, onClose, relatorio, filtros }: ModalExportarProps) {
  const [exportando, setExportando] = useState<FormatoExportacao | null>(null);

  async function handleExport(formato: FormatoExportacao) {
    setExportando(formato);
    try {
      switch (formato) {
        case "pdf":
          exportarPDF(relatorio, filtros);
          break;
        case "excel":
          exportarExcel(relatorio, filtros);
          break;
        case "word":
          await exportarWord(relatorio, filtros);
          break;
      }
      onClose();
    } catch (error) {
      console.error(`Erro ao exportar ${formato}:`, error);
    } finally {
      setExportando(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-2xl rounded-2xl border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold">Exportar Relatório</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Escolha o formato de exportação
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {FORMATOS.map(({ formato, titulo, descricao, icone: Icon, cor, corBg }) => (
                  <button
                    key={formato}
                    onClick={() => handleExport(formato)}
                    disabled={exportando !== null}
                    className={cn(
                      "group relative flex flex-col items-center gap-3 rounded-xl border-2 p-6 text-center transition-all",
                      "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                      corBg,
                      exportando === formato && "ring-2 ring-primary"
                    )}
                  >
                    {exportando === formato ? (
                      <Loader2 className={cn("h-10 w-10 animate-spin", cor)} />
                    ) : (
                      <Icon className={cn("h-10 w-10", cor)} />
                    )}
                    <div>
                      <p className="font-semibold text-sm">{titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {descricao}
                      </p>
                    </div>
                    {exportando === formato && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        A exportar...
                      </span>
                    )}
                    {exportando === null && (
                      <span className="text-xs text-primary font-medium flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Download className="h-3 w-3" />
                        Exportar
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Período: {filtros.dataInicio} a {filtros.dataFim}
              </p>
              <button
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

