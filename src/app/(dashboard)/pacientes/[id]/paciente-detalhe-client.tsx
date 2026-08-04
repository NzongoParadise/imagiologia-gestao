"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  FileText,
  Microscope,
  Image,
  AlertCircle,
  Download,
} from "lucide-react";
import { formatDate, formatPhone } from "@/utils/format";
import { cn } from "@/utils/cn";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ImageGallery } from "@/components/layout/image-viewer";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface PacienteDetalheClientProps {
  paciente: {
    id: number;
    numeroProcesso: string;
    nome: string;
    dataNascimento: string | null;
    sexo: string | null;
    telefone: string | null;
    email: string | null;
    endereco: string | null;
    nif: string | null;
    bi: string | null;
    foto: string | null;
    observacoes: string | null;
    createdAt: string;
    _count: { exames: number };
    exames: Array<{
      id: number;
      codigo: string | null;
      estado: string;
      dataExame: string;
      medicoSolicitante: string | null;
      observacao: string | null;
      tipoExame: { id: number; nome: string; modalidade: string | null };
      tecnico: { id: number; nome: string } | null;
      procedencia: { id: number; nome: string } | null;
      imagens: Array<{ id: number; filename: string; originalName: string; path: string }>;
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

export function PacienteDetalheClient({ paciente }: PacienteDetalheClientProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exameSelecionado, setExameSelecionado] = useState<number | null>(null);

  const idade = paciente.dataNascimento
    ? Math.floor(
        (new Date().getTime() - new Date(paciente.dataNascimento).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  const examesComImagens = paciente.exames.filter((e) => e.imagens.length > 0);
  const todasImagens = paciente.exames.flatMap((e) =>
    e.imagens.map((img) => ({
      id: img.id,
      url: `/api/imagens/${img.filename}`,
      name: img.originalName,
    }))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/pacientes"
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{paciente.nome}</h1>
          <p className="text-sm text-muted-foreground">
            Processo #{paciente.numeroProcesso}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/pacientes/${paciente.id}/editar`}
            className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 rounded-lg border border-destructive/20 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card p-6 text-center">
            <Avatar
              src={paciente.foto}
              name={paciente.nome}
              size="xl"
              className="mx-auto"
            />
            <h2 className="mt-4 text-lg font-semibold">{paciente.nome}</h2>
            <p className="text-sm text-muted-foreground">
              {paciente.sexo === "M" ? "Masculino" : paciente.sexo === "F" ? "Feminino" : "Não definido"}
              {idade && ` · ${idade} anos`}
            </p>
            <div className="mt-6 space-y-3 text-left">
              {paciente.telefone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{formatPhone(paciente.telefone)}</span>
                </div>
              )}
              {paciente.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{paciente.email}</span>
                </div>
              )}
              {paciente.endereco && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{paciente.endereco}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>Registado em {formatDate(paciente.createdAt)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{paciente._count.exames} exame(s) realizado(s)</span>
              </div>
              {paciente.nif && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>NIF: {paciente.nif}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exames */}
          <div className="rounded-xl border bg-card">
            <div className="border-b px-5 py-4">
              <h2 className="font-semibold">Histórico de Exames</h2>
            </div>
            <div className="divide-y">
              {paciente.exames.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <Microscope className="h-12 w-12 mb-3" />
                  <p className="text-sm">Nenhum exame registado</p>
                  <Link
                    href="/exames/novo"
                    className="mt-3 text-sm font-medium text-primary hover:underline"
                  >
                    Agendar exame
                  </Link>
                </div>
              ) : (
                paciente.exames.map((exame) => (
                  <div key={exame.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium">{exame.tipoExame.nome}</h3>
                          {exame.codigo && (
                            <span className="text-xs text-muted-foreground">#{exame.codigo}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{formatDate(exame.dataExame)}</span>
                          {exame.tecnico && <span>Técnico: {exame.tecnico.nome}</span>}
                          {exame.procedencia && <span>{exame.procedencia.nome}</span>}
                          {exame.medicoSolicitante && (
                            <span>Médico: {exame.medicoSolicitante}</span>
                          )}
                        </div>
                        {exame.observacao && (
                          <p className="mt-1 text-xs text-muted-foreground italic">
                            {exame.observacao}
                          </p>
                        )}
                        {exame.imagens.length > 0 && (
                          <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                            <Image className="h-3 w-3" />
                            {exame.imagens.length} imagem(ns)
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn(
                          "rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                          statusColors[exame.estado] || "bg-muted text-muted-foreground"
                        )}>
                          {exame.estado}
                        </span>
                        <Link
                          href={`/exames/${exame.id}`}
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors"
                        >
                          <ArrowLeft className="h-4 w-4 rotate-180" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Imagens */}
          {todasImagens.length > 0 && (
            <div className="rounded-xl border bg-card">
              <div className="border-b px-5 py-4">
                <h2 className="font-semibold">Imagens ({todasImagens.length})</h2>
              </div>
              <div className="p-5">
                <ImageGallery images={todasImagens} />
              </div>
            </div>
          )}

          {/* Observações */}
          {paciente.observacoes && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold mb-2">Observações</h2>
              <p className="text-sm text-muted-foreground">{paciente.observacoes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Eliminar Paciente"
        description="Tem a certeza que deseja eliminar este paciente? Esta ação é irreversível."
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>Todos os exames e imagens associados serão removidos.</span>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                try {
                  const { eliminarPaciente } = await import(
                    "@/server/actions/pacientes-actions"
                  );
                  await eliminarPaciente(paciente.id);
                  toast.success("Paciente eliminado com sucesso");
                  router.push("/pacientes");
                } catch {
                  toast.error("Erro ao eliminar paciente");
                }
              }}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

