"use client";

import { useState } from "react";
import {
  MessageCircle,
  Mail,
  MessageSquare,
  Bluetooth,
  Copy,
  X,
  Check,
  Share2,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { formatDate, formatDateTime } from "@/utils/format";
import { toast } from "sonner";

interface ExamePartilhaData {
  id: number;
  codigo: string | null;
  estado: string;
  dataExame: string;
  medicoSolicitante: string | null;
  observacao: string | null;
  paciente: {
    nome: string;
    numeroProcesso: string;
    telefone: string | null;
    email: string | null;
  };
  tipoExame: {
    nome: string;
    modalidade: string | null;
  };
  tecnico: { nome: string } | null;
  procedencia: { nome: string } | null;
}

interface ModalPartilhaProps {
  open: boolean;
  onClose: () => void;
  exame: ExamePartilhaData;
}

type OpcaoPartilha =
  | "whatsapp"
  | "email"
  | "sms"
  | "share"
  | "copiar";

interface OpcaoConfig {
  id: OpcaoPartilha;
  titulo: string;
  descricao: string;
  icone: React.ElementType;
  cor: string;
  corBg: string;
}

const OPCOES: OpcaoConfig[] = [
  {
    id: "whatsapp",
    titulo: "WhatsApp",
    descricao: "Abrir conversa no WhatsApp com mensagem pré-formatada",
    icone: MessageCircle,
    cor: "text-emerald-600",
    corBg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
  },
  {
    id: "email",
    titulo: "Email",
    descricao: "Enviar por email com assunto e corpo preenchidos",
    icone: Mail,
    cor: "text-blue-600",
    corBg: "bg-blue-50 border-blue-200 hover:bg-blue-100",
  },
  {
    id: "sms",
    titulo: "SMS",
    descricao: "Enviar mensagem de texto (telemóvel)",
    icone: MessageSquare,
    cor: "text-violet-600",
    corBg: "bg-violet-50 border-violet-200 hover:bg-violet-100",
  },
  {
    id: "share",
    titulo: "Bluetooth / Partilha nativa",
    descricao: "Usar partilha nativa do dispositivo (Bluetooth, WiFi Direct, etc.)",
    icone: Bluetooth,
    cor: "text-sky-600",
    corBg: "bg-sky-50 border-sky-200 hover:bg-sky-100",
  },
  {
    id: "copiar",
    titulo: "Copiar para área de transferência",
    descricao: "Copiar resumo completo do exame para colar onde quiser",
    icone: Copy,
    cor: "text-amber-600",
    corBg: "bg-amber-50 border-amber-200 hover:bg-amber-100",
  },
];

function formatarMensagemWhatsApp(exame: ExamePartilhaData): string {
  const linhas = [
    `📋 *Exame #${exame.codigo || exame.id}*`,
    `👤 *Paciente:* ${exame.paciente.nome}`,
    `📄 *Processo:* #${exame.paciente.numeroProcesso}`,
    `🔬 *Tipo de Exame:* ${exame.tipoExame.nome}`,
    `📅 *Data:* ${formatDateTime(exame.dataExame)}`,
    `📊 *Estado:* ${exame.estado}`,
  ];

  if (exame.tecnico) linhas.push(`👨‍🔬 *Técnico:* ${exame.tecnico.nome}`);
  if (exame.procedencia) linhas.push(`🏥 *Procedência:* ${exame.procedencia.nome}`);
  if (exame.medicoSolicitante) linhas.push(`👨‍⚕️ *Médico:* ${exame.medicoSolicitante}`);
  if (exame.observacao) linhas.push(`📝 *Observações:* ${exame.observacao}`);

  return linhas.join("\n");
}

function formatarCorpoEmail(exame: ExamePartilhaData): string {
  const linhas = [
    `Exame #${exame.codigo || exame.id}`,
    `Paciente: ${exame.paciente.nome} (Processo: #${exame.paciente.numeroProcesso})`,
    `Tipo de Exame: ${exame.tipoExame.nome}${exame.tipoExame.modalidade ? ` - ${exame.tipoExame.modalidade}` : ""}`,
    `Data: ${formatDateTime(exame.dataExame)}`,
    `Estado: ${exame.estado}`,
  ];

  if (exame.tecnico) linhas.push(`Técnico: ${exame.tecnico.nome}`);
  if (exame.procedencia) linhas.push(`Procedência: ${exame.procedencia.nome}`);
  if (exame.medicoSolicitante) linhas.push(`Médico solicitante: ${exame.medicoSolicitante}`);
  if (exame.observacao) linhas.push(`\nObservações:\n${exame.observacao}`);

  return linhas.join("\n");
}

function formatarResumo(exame: ExamePartilhaData): string {
  const linhas = [
    `═══════════════════════════════════`,
    `  EXAME #${exame.codigo || exame.id}`,
    `═══════════════════════════════════`,
    ``,
    `Paciente: ${exame.paciente.nome}`,
    `Nº Processo: #${exame.paciente.numeroProcesso}`,
    `Tipo: ${exame.tipoExame.nome}${exame.tipoExame.modalidade ? ` (${exame.tipoExame.modalidade})` : ""}`,
    `Data: ${formatDateTime(exame.dataExame)}`,
    `Estado: ${exame.estado}`,
  ];

  if (exame.tecnico) linhas.push(`Técnico: ${exame.tecnico.nome}`);
  if (exame.procedencia) linhas.push(`Procedência: ${exame.procedencia.nome}`);
  if (exame.medicoSolicitante) linhas.push(`Médico: ${exame.medicoSolicitante}`);
  if (exame.observacao) linhas.push(`\nObservações:\n${exame.observacao}`);

  return linhas.join("\n");
}

export function ModalPartilha({ open, onClose, exame }: ModalPartilhaProps) {
  const [copiado, setCopiado] = useState(false);
  const [acaoLoading, setAcaoLoading] = useState<OpcaoPartilha | null>(null);

  async function handlePartilhar(opcao: OpcaoPartilha) {
    setAcaoLoading(opcao);

    try {
      switch (opcao) {
        case "whatsapp": {
          const texto = encodeURIComponent(formatarMensagemWhatsApp(exame));
          window.open(`https://wa.me/?text=${texto}`, "_blank", "noopener,noreferrer");
          break;
        }

        case "email": {
          const assunto = encodeURIComponent(`Exame #${exame.codigo || exame.id} - ${exame.paciente.nome}`);
          const corpo = encodeURIComponent(formatarCorpoEmail(exame));
          const destinatario = exame.paciente.email || "";
          window.open(`mailto:${destinatario}?subject=${assunto}&body=${corpo}`, "_blank", "noopener,noreferrer");
          break;
        }

        case "sms": {
          const texto = encodeURIComponent(formatarMensagemWhatsApp(exame));
          const telefone = exame.paciente.telefone || "";
          window.open(`sms:${telefone}?body=${texto}`, "_blank", "noopener,noreferrer");
          break;
        }

        case "share": {
          if (navigator.share) {
            const resumo = formatarResumo(exame);
            await navigator.share({
              title: `Exame #${exame.codigo || exame.id} - ${exame.paciente.nome}`,
              text: resumo,
            });
          } else {
            toast.error("Partilha nativa não suportada neste navegador");
          }
          break;
        }

        case "copiar": {
          const resumo = formatarResumo(exame);
          await navigator.clipboard.writeText(resumo);
          setCopiado(true);
          toast.success("Resumo do exame copiado para a área de transferência");
          setTimeout(() => setCopiado(false), 3000);
          break;
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error(`Erro ao partilhar via ${opcao}:`, error);
        toast.error("Erro ao realizar a operação");
      }
    } finally {
      setAcaoLoading(null);
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
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-muted-foreground" />
                  Partilhar Exame
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  #{exame.codigo || exame.id} · {exame.paciente.nome} · {exame.tipoExame.nome}
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {OPCOES.map(({ id, titulo, descricao, icone: Icon, cor, corBg }) => (
                  <button
                    key={id}
                    onClick={() => handlePartilhar(id)}
                    disabled={acaoLoading !== null}
                    className={cn(
                      "group relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-center transition-all",
                      "hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed",
                      corBg,
                      acaoLoading === id && "ring-2 ring-primary"
                    )}
                  >
                    <div className={cn("rounded-full p-2.5 transition-colors", cor, "bg-white/80")}>
                      {id === "copiar" && copiado ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {descricao}
                      </p>
                    </div>
                    {acaoLoading === null && (
                      <span className="text-xs text-primary font-medium flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="h-3 w-3" />
                        {id === "copiar" ? (copiado ? "Copiado" : "Copiar") : "Abrir"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t px-6 py-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {formatDate(exame.dataExame)} · {exame.estado}
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

