"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Stethoscope, Phone, Mail, Search } from "lucide-react";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { criarTecnico, atualizarTecnico, eliminarTecnico } from "@/server/actions/tecnicos-actions";
import { usePermissoes } from "@/hooks/use-permissoes";

interface Tecnico {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  especialidade: string | null;
  ativo: boolean;
  _count: { exames: number };
}

interface TecnicosClientProps {
  tecnicos: Tecnico[];
}

export function TecnicosClient({ tecnicos }: TecnicosClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = tecnicos.filter(
    (t) =>
      t.nome.toLowerCase().includes(search.toLowerCase()) ||
      t.email?.toLowerCase().includes(search.toLowerCase()) ||
      t.especialidade?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      email: (formData.get("email") as string) || null,
      telefone: (formData.get("telefone") as string) || null,
      especialidade: (formData.get("especialidade") as string) || null,
      ativo: formData.get("ativo") === "on",
    };

    try {
      if (editingId) {
        await atualizarTecnico(editingId, data);
        toast.success("Técnico atualizado com sucesso");
      } else {
        await criarTecnico(data);
        toast.success("Técnico criado com sucesso");
      }
      setModalOpen(false);
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("Erro ao guardar técnico");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Eliminar técnico "${nome}"?`)) return;
    try {
      await eliminarTecnico(id);
      toast.success("Técnico eliminado");
      router.refresh();
    } catch {
      toast.error("Erro ao eliminar técnico");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Técnicos</h1>
          <p className="text-sm text-muted-foreground">{tecnicos.length} técnico(s)</p>
        </div>
        {pode("tecnicos", "criar") && (
          <button
            onClick={() => {
              setEditingId(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Técnico
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Pesquisar técnicos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Stethoscope className="h-8 w-8" />}
          title="Nenhum técnico encontrado"
          description="Adicione um novo técnico ao sistema"
          action={pode("tecnicos", "criar") ? (
            <button
              onClick={() => {
                setEditingId(null);
                setModalOpen(true);
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Adicionar Técnico
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((tecnico) => (
            <div
              key={tecnico.id}
              className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                    <Stethoscope className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{tecnico.nome}</h3>
                    {tecnico.especialidade && (
                      <p className="text-xs text-muted-foreground">{tecnico.especialidade}</p>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    tecnico.ativo
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {tecnico.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>

              <div className="space-y-1.5 text-sm text-muted-foreground">
                {tecnico.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{tecnico.telefone}</span>
                  </div>
                )}
                {tecnico.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{tecnico.email}</span>
                  </div>
                )}
                <p className="text-xs">{tecnico._count.exames} exame(s)</p>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                {pode("tecnicos", "editar") && (
                  <button
                    onClick={() => {
                      setEditingId(tecnico.id);
                      setModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </button>
                )}
                {pode("tecnicos", "eliminar") && (
                  <button
                    onClick={() => handleDelete(tecnico.id, tecnico.nome)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Editar Técnico" : "Novo Técnico"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome *</label>
            <input
              name="nome"
              required
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                name="email"
                type="email"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <input
                name="telefone"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Especialidade</label>
            <input
              name="especialidade"
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <input name="ativo" type="checkbox" defaultChecked className="rounded" />
            <label className="text-sm">Ativo</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setModalOpen(false);
                setEditingId(null);
              }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

