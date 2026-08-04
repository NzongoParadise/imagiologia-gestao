"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { atualizarExame } from "@/server/actions/exames-actions";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface SelectOption {
  id: number;
  nome: string;
  numeroProcesso?: string;
}

interface ExameData {
  id: number;
  codigo: string | null;
  pacienteId: number;
  tipoExameId: number;
  tecnicoId: number | null;
  procedenciaId: number | null;
  medicoSolicitante: string | null;
  observacao: string | null;
  estado: string;
  dataExame: string;
  paciente: { id: number; nome: string; numeroProcesso: string };
  tipoExame: { id: number; nome: string };
  tecnico: { id: number; nome: string } | null;
  procedencia: { id: number; nome: string } | null;
}

interface EditarExameClientProps {
  exame: ExameData;
  tiposExame: SelectOption[];
  tecnicos: SelectOption[];
  procedencias: SelectOption[];
}

export function EditarExameClient({ exame, tiposExame, tecnicos, procedencias }: EditarExameClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      tipoExameId: Number(formData.get("tipoExameId")),
      tecnicoId: formData.get("tecnicoId") ? Number(formData.get("tecnicoId")) : null,
      procedenciaId: formData.get("procedenciaId") ? Number(formData.get("procedenciaId")) : null,
      medicoSolicitante: (formData.get("medicoSolicitante") as string) || null,
      observacao: (formData.get("observacao") as string) || null,
      estado: formData.get("estado") as string,
      dataExame: (formData.get("dataExame") as string) || undefined,
    };

    try {
      await atualizarExame(exame.id, data);
      toast.success("Exame atualizado com sucesso!");
      router.push(`/exames/${exame.id}`);
    } catch {
      toast.error("Erro ao atualizar exame");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link
          href={`/exames/${exame.id}`}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Editar Exame</h1>
          <p className="text-sm text-muted-foreground">
            #{exame.codigo || exame.id} — {exame.paciente.nome}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-xl border bg-card p-6">
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium">Paciente</label>
            <input
              type="text"
              value={`${exame.paciente.nome} (#${exame.paciente.numeroProcesso})`}
              disabled
              className="w-full rounded-lg border bg-muted px-3 py-2.5 text-sm text-muted-foreground"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Exame *</label>
              <select
                name="tipoExameId"
                required
                defaultValue={exame.tipoExameId}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Selecionar...</option>
                {tiposExame.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <select
                name="estado"
                defaultValue={exame.estado}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="Pendente">Pendente</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Realizado">Realizado</option>
                <option value="Entregue">Entregue</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Procedência</label>
              <select
                name="procedenciaId"
                defaultValue={exame.procedenciaId || ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Selecionar...</option>
                {procedencias.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Técnico</label>
              <select
                name="tecnicoId"
                defaultValue={exame.tecnicoId || ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Selecionar...</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Médico Solicitante</label>
              <input
                name="medicoSolicitante"
                defaultValue={exame.medicoSolicitante || ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data do Exame</label>
              <input
                name="dataExame"
                type="date"
                defaultValue={exame.dataExame ? exame.dataExame.split("T")[0] : ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Observação</label>
              <textarea
                name="observacao"
                rows={3}
                defaultValue={exame.observacao || ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "A guardar..." : "Guardar Alterações"}
          </button>
          <Link
            href={`/exames/${exame.id}`}
            className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </motion.div>
  );
}

