"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { atualizarPaciente } from "@/server/actions/pacientes-actions";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface PacienteData {
  id: number;
  numeroProcesso: string;
  nome: string;
  dataNascimento: string | null;
  sexo: string | null;
  telefone: string | null;
  email: string | null;
  endereco: string | null;
  documento: string | null;
  nif: string | null;
  bi: string | null;
  observacoes: string | null;
}

interface EditarPacienteClientProps {
  paciente: PacienteData;
}

export function EditarPacienteClient({ paciente }: EditarPacienteClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
const data = {
      numeroProcesso: formData.get("numeroProcesso") as string,
      nome: formData.get("nome") as string,
      dataNascimento: formData.get("dataNascimento") as string,
      sexo: formData.get("sexo") as string,
      telefone: (formData.get("telefone") as string) || null,
      email: (formData.get("email") as string) || null,
      endereco: formData.get("endereco") as string,
      documento: (formData.get("documento") as string) || null,
      nif: (formData.get("nif") as string) || null,
      bi: (formData.get("bi") as string) || null,
      foto: null,
      observacoes: (formData.get("observacoes") as string) || null,
    };

    try {
      await atualizarPaciente(paciente.id, data);
      toast.success("Paciente atualizado com sucesso!");
      router.push(`/pacientes/${paciente.id}`);
    } catch {
      toast.error("Erro ao atualizar paciente");
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
          href={`/pacientes/${paciente.id}`}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Editar Paciente</h1>
          <p className="text-sm text-muted-foreground">{paciente.nome}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-xl border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Nº Processo *</label>
              <input
                name="numeroProcesso"
                required
                defaultValue={paciente.numeroProcesso}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Nome completo *</label>
              <input
                name="nome"
                required
                defaultValue={paciente.nome}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
<div className="space-y-2">
              <label className="text-sm font-medium">Data de Nascimento *</label>
              <input
                name="dataNascimento"
                type="date"
                required
                defaultValue={paciente.dataNascimento ? paciente.dataNascimento.split("T")[0] : ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sexo *</label>
              <select
                name="sexo"
                required
                defaultValue={paciente.sexo || ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Selecionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="O">Outro</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">NIF</label>
              <input
                name="nif"
                defaultValue={paciente.nif || ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">BI</label>
              <input
                name="bi"
                defaultValue={paciente.bi || ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <input
                name="telefone"
                defaultValue={paciente.telefone || ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                defaultValue={paciente.email || ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
<div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Endereço *</label>
              <input
                name="endereco"
                required
                defaultValue={paciente.endereco || ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Documento</label>
              <input
                name="documento"
                defaultValue={paciente.documento || ""}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Observações</label>
              <textarea
                name="observacoes"
                rows={3}
                defaultValue={paciente.observacoes || ""}
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
            href={`/pacientes/${paciente.id}`}
            className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </motion.div>
  );
}

