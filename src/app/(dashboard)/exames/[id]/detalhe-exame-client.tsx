"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Microscope,
  User,
  Calendar,
  FileText,
  Image,
  Upload,
  Trash2,
  Download,
  Pencil,
  Check,
  Loader2,
  Share2,
} from "lucide-react";
import { formatDate, formatDateTime, formatBytes } from "@/utils/format";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { FileUploader } from "@/components/layout/file-uploader";
import { ImageGallery } from "@/components/layout/image-viewer";
import { MLAnalise } from "@/features/imagens/components/ml-analise";
import { AnotacoesExame } from "@/features/anotacoes/components/anotacoes-exame";
import { atualizarEstadoExame } from "@/server/actions/exames-actions";
import { uploadImagem, removerImagem } from "@/server/actions/imagens-actions";
import { ModalPartilha } from "@/components/ui/modal-partilha";
import { usePermissoes } from "@/hooks/use-permissoes";

interface DetalheExameClientProps {
  exame: {
    id: number;
    codigo: string | null;
    estado: string;
    dataExame: string;
    medicoSolicitante: string | null;
    observacao: string | null;
    createdAt: string;
    paciente: {
      id: number;
      nome: string;
      numeroProcesso: string;
      telefone: string | null;
      email: string | null;
      dataNascimento: string | null;
      sexo: string | null;
    };
    tipoExame: { id: number; nome: string; modalidade: string | null };
    tecnico: { id: number; nome: string } | null;
    procedencia: { id: number; nome: string } | null;
    realizadoPor: { id: number; nome: string } | null;
    imagens: Array<{
      id: number;
      filename: string;
      originalName: string;
      mimeType: string;
      tamanho: number;
      path: string;
      createdAt: string;
    }>;
  };
}

const statusColors: Record<string, string> = {
  Pendente: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  "Em andamento": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Realizado: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Entregue: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Cancelado: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const estadosPermitidos = ["Pendente", "Em andamento", "Realizado", "Entregue", "Cancelado"];

export function DetalheExameClient({ exame }: DetalheExameClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const images = exame.imagens.map((img) => ({
    id: img.id,
    url: img.path,
    name: img.originalName,
  }));

  const handleStatusChange = async (novoEstado: string) => {
    if (novoEstado === exame.estado) return;
    setChangingStatus(true);
    try {
      await atualizarEstadoExame(exame.id, novoEstado);
      toast.success(`Exame alterado para "${novoEstado}"`);
      router.refresh();
    } catch {
      toast.error("Erro ao alterar estado");
    } finally {
      setChangingStatus(false);
      setShowStatusMenu(false);
    }
  };

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        await uploadImagem(exame.id, formData);
      }
      toast.success(`${files.length} imagem(ns) enviada(s)`);
      router.refresh();
    } catch {
      toast.error("Erro ao enviar imagens");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (id: number, name: string) => {
    if (!confirm(`Remover imagem "${name}"?`)) return;
    try {
      await removerImagem(id);
      toast.success("Imagem removida");
      router.refresh();
    } catch {
      toast.error("Erro ao remover imagem");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/exames" className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Exame #{exame.codigo || exame.id}</h1>
            {pode("exames", "editar") && (
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  statusColors[exame.estado] || "bg-muted text-muted-foreground")}
              >
                {exame.estado}
              </button>
              {showStatusMenu && (
                <div className="absolute left-0 top-full mt-1 z-40 w-40 rounded-lg border bg-card shadow-xl p-1 animate-scale-in">
                  {estadosPermitidos.map((estado) => (
                    <button
                      key={estado}
                      onClick={() => handleStatusChange(estado)}
                      disabled={changingStatus || estado === exame.estado}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                        estado === exame.estado
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {changingStatus ? <Loader2 className="h-3 w-3 animate-spin" /> : estado === exame.estado ? <Check className="h-3 w-3" /> : null}
                      {estado}
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{exame.tipoExame.nome}</p>
        </div>
{pode("exames", "editar") && (
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Partilhar
          </button>
        )}
        {pode("exames", "editar") && (
          <Link
            href={`/exames/${exame.id}/editar`}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-semibold mb-4">Informação do Exame</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{formatDateTime(exame.dataExame)}</span>
              </div>
              {exame.tecnico && (
                <div className="flex items-center gap-3 text-sm">
                  <Microscope className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{exame.tecnico.nome}</span>
                </div>
              )}
              {exame.procedencia && (
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{exame.procedencia.nome}</span>
                </div>
              )}
              {exame.medicoSolicitante && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{exame.medicoSolicitante}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Image className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{exame.imagens.length} imagem(ns)</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5">
            <Link href={`/pacientes/${exame.paciente.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Avatar name={exame.paciente.nome} size="lg" />
              <div>
                <h3 className="font-semibold">{exame.paciente.nome}</h3>
                <p className="text-xs text-muted-foreground">#{exame.paciente.numeroProcesso}</p>
              </div>
            </Link>
          </div>

          {exame.observacao && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold mb-2">Observações</h2>
              <p className="text-sm text-muted-foreground">{exame.observacao}</p>
            </div>
          )}
        </div>

        {/* Imagens */}
        <div className="lg:col-span-2 space-y-4">
{/* Upload Section */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Imagens</h2>
              {pode("imagens", "criar") && (
                <button
                  onClick={() => setShowUpload(!showUpload)}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5" />
                  {showUpload ? "Fechar" : "Upload"}
                </button>
              )}
            </div>

            {showUpload && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4">
                <FileUploader
                  onUpload={handleUpload}
                  maxFiles={10}
                />
              </motion.div>
            )}

            {exame.imagens.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Image className="h-12 w-12 mb-3" />
                <p className="text-sm">Nenhuma imagem associada</p>
                {pode("imagens", "criar") && (
                <button onClick={() => setShowUpload(true)} className="mt-2 text-xs font-medium text-primary hover:underline">
                  Adicionar imagens
                </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {exame.imagens.map((img) => (
                  <div key={img.id} className="flex items-center gap-4 rounded-lg border p-3 hover:bg-muted/30 transition-colors">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {img.mimeType.startsWith("image/") ? (
                        <img src={img.path} alt={img.originalName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{img.originalName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(img.tamanho)} · {formatDate(img.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <MLAnalise
                        imagemId={img.id}
                        imageUrl={img.path}
                        imageName={img.originalName}
                      />
                      <a href={img.path} download={img.originalName}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors">
                        <Download className="h-4 w-4" />
                      </a>
                      {pode("imagens", "eliminar") && (
                      <button onClick={() => handleDeleteImage(img.id, img.originalName)}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold mb-4">Galeria</h2>
              <ImageGallery images={images} />
            </div>
          )}
        </div>
</div>

      {/* Anotacoes */}
      <AnotacoesExame exameId={exame.id} pacienteId={exame.paciente.id} />

      <ModalPartilha
        open={showShare}
        onClose={() => setShowShare(false)}
        exame={{
          id: exame.id,
          codigo: exame.codigo,
          estado: exame.estado,
          dataExame: exame.dataExame,
          medicoSolicitante: exame.medicoSolicitante,
          observacao: exame.observacao,
          paciente: {
            nome: exame.paciente.nome,
            numeroProcesso: exame.paciente.numeroProcesso,
            telefone: exame.paciente.telefone,
            email: exame.paciente.email,
          },
          tipoExame: {
            nome: exame.tipoExame.nome,
            modalidade: exame.tipoExame.modalidade,
          },
          tecnico: exame.tecnico ? { nome: exame.tecnico.nome } : null,
          procedencia: exame.procedencia ? { nome: exame.procedencia.nome } : null,
        }}
      />
    </motion.div>
  );
}

