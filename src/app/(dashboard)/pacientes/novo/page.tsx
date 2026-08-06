"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { criarPaciente } from "@/server/actions/pacientes-actions";
import { motion } from "framer-motion";

export default function NovoPacientePage() {
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
      await criarPaciente(data);
      toast.success("Paciente criado com sucesso!");
      router.push("/pacientes");
    } catch {
      toast.error("Erro ao criar paciente");
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
          href="/pacientes"
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Paciente</h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados do paciente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-xl border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">N Processo *</label>
              <input
                name="numeroProcesso"
                required
                placeholder="Ex: PROC-001"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Nome completo *</label>
              <input
                name="nome"
                required
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
<div className="space-y-2">
              <label className="text-sm font-medium">Data de Nascimento *</label>
              <input
                name="dataNascimento"
                type="date"
                required
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sexo *</label>
              <select
                name="sexo"
                required
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Selecionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">NIF</label>
              <input
                name="nif"
                placeholder="123456789"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">BI</label>
              <input
                name="bi"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Documento</label>
              <input
                name="documento"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <input
                name="telefone"
                placeholder="912345678"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                placeholder="paciente@email.com"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
<div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Endereço *</label>
              <input
                name="endereco"
                required
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Observacoes</label>
              <textarea
                name="observacoes"
                rows={3}
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
            {loading ? "A guardar..." : "Guardar Paciente"}
          </button>
          <Link
            href="/pacientes"
            className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
