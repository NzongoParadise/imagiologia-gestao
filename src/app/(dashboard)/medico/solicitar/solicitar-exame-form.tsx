"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Microscope, AlertCircle } from "lucide-react";
import { solicitarExame } from "@/server/actions/medico-actions";

interface SelectOption {
  id: number;
  nome: string;
  numeroProcesso?: string;
}

interface Props {
  pacientes: SelectOption[];
  tiposExame: SelectOption[];
}

const prioridades = [
  { value: "Normal", label: "Normal", color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" },
  { value: "Prioritário", label: "Prioritário", color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "Urgente", label: "Urgente", color: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400" },
  { value: "Emergência", label: "Emergência", color: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" },
];

export function SolicitarExameForm({ pacientes, tiposExame }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [prioridade, setPrioridade] = useState("Normal");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      pacienteId: Number(formData.get("pacienteId")),
      tipoExameId: Number(formData.get("tipoExameId")),
      diagnosticoClinico: String(formData.get("diagnosticoClinico") || ""),
      prioridade,
      justificacaoClinica: String(formData.get("justificacaoClinica") || ""),
      observacoes: (formData.get("observacoes") as string) || null,
      medicoSolicitante: (formData.get("medicoSolicitante") as string) || null,
    };

    try {
      await solicitarExame(data);
      toast.success("Exame solicitado com sucesso!");
      router.push("/medico/acompanhamento");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao solicitar exame";
      toast.error(message);
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
          href="/medico"
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Microscope className="h-6 w-6 text-primary" />
            Solicitar Exame
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preencha os dados clínicos para solicitar um exame de imagiologia.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Dados do exame */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-sm font-semibold mb-4">Dados da Solicitação</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Paciente *</label>
              <select
                name="pacienteId"
                required
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Selecionar paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.numeroProcesso ? `(#${p.numeroProcesso})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Exame *</label>
              <select
                name="tipoExameId"
                required
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Selecionar...</option>
                {tiposExame.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade *</label>
              <select
                value={prioridade}
                onChange={(e) => setPrioridade(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                {prioridades.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Diagnóstico Clínico *</label>
              <textarea
                name="diagnosticoClinico"
                required
                rows={2}
                placeholder="Descreva o diagnóstico clínico do paciente..."
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Justificação Clínica *</label>
              <textarea
                name="justificacaoClinica"
                required
                rows={3}
                placeholder="Justifique a necessidade do exame..."
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Observações</label>
              <textarea
                name="observacoes"
                rows={3}
                placeholder="Informações adicionais relevantes..."
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Médico Solicitante</label>
              <input
                name="medicoSolicitante"
                placeholder="Dr. Nome do médico"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {/* Nota sobre prioridade */}
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
          <p>
            A prioridade selecionada é {prioridade}. Para alterar a prioridade depois da
            solicitação, use a opção no detalhe do exame. Alterações de prioridade para
            Urgente ou Emergência requerem justificação.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "A guardar..." : "Solicitar Exame"}
          </button>
          <Link
            href="/medico"
            className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
