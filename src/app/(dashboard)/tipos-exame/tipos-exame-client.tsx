"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Microscope, Search } from "lucide-react";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { criarTipoExame, atualizarTipoExame, eliminarTipoExame } from "@/server/actions/tipos-exame-actions";
import { usePermissoes } from "@/hooks/use-permissoes";

interface TipoExame {
  id: number;
  nome: string;
  modalidade: string | null;
  descricao: string | null;
  duracaoMin: number | null;
  preco: number | null;
  ativo: boolean;
  _count: { exames: number };
}

interface TiposExameClientProps {
  tiposExame: TipoExame[];
}

export function TiposExameClient({ tiposExame }: TiposExameClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = tiposExame.filter(
    (t) =>
      t.nome.toLowerCase().includes(search.toLowerCase()) ||
      t.modalidade?.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      modalidade: (formData.get("modalidade") as string) || null,
      descricao: (formData.get("descricao") as string) || null,
      duracaoMin: formData.get("duracaoMin") ? Number(formData.get("duracaoMin")) : null,
      preco: formData.get("preco") ? Number(formData.get("preco")) : null,
      ativo: formData.get("ativo") === "on",
    };

    try {
      if (editingId) {
        await atualizarTipoExame(editingId, data);
        toast.success("Tipo de exame atualizado");
      } else {
        await criarTipoExame(data);
        toast.success("Tipo de exame criado");
      }
      setModalOpen(false);
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("Erro ao guardar");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: number, nome: string) {
    if (!confirm(`Eliminar "${nome}"?`)) return;
    try {
      await eliminarTipoExame(id);
      toast.success("Eliminado com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro ao eliminar");
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tipos de Exame</h1>
          <p className="text-sm text-muted-foreground">{tiposExame.length} tipo(s)</p>
        </div>
        {pode("tipos-exame", "criar") && (
          <button onClick={() => { setEditingId(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Novo Tipo
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Pesquisar..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Microscope className="h-8 w-8" />} title="Nenhum tipo de exame"
          description="Adicione tipos como RX Tórax, TAC, Ecografia, etc."
          action={pode("tipos-exame", "criar") ? (
            <button onClick={() => { setEditingId(null); setModalOpen(true); }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Adicionar</button>
          ) : undefined} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <div key={t.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Microscope className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t.nome}</h3>
                    {t.modalidade && <p className="text-xs text-muted-foreground">{t.modalidade}</p>}
                  </div>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium",
                  t.ativo ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
                  {t.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              {t.descricao && <p className="text-sm text-muted-foreground mb-2">{t.descricao}</p>}
              <div className="flex gap-4 text-xs text-muted-foreground">
                {t.duracaoMin && <span>⏱ {t.duracaoMin}min</span>}
                {t.preco && <span>💰 {t.preco.toFixed(2)}€</span>}
                <span>📋 {t._count.exames} exame(s)</span>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                {pode("tipos-exame", "editar") && (
                  <button onClick={() => { setEditingId(t.id); setModalOpen(true); }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                )}
                {pode("tipos-exame", "eliminar") && (
                  <button onClick={() => handleDelete(t.id, t.nome)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }}
        title={editingId ? "Editar Tipo de Exame" : "Novo Tipo de Exame"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome *</label>
            <input name="nome" required
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Modalidade</label>
              <select name="modalidade"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30">
                <option value="">Selecionar...</option>
                {["Ressonância Magnética", "Tomografia Computorizada", "Raio-X", "Ecografia", "Mamografia", "Densitometria Óssea", "Medicina Nuclear", "Angiografia"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração (min)</label>
              <input name="duracaoMin" type="number"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Preço (€)</label>
              <input name="preco" type="number" step="0.01"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <input name="ativo" type="checkbox" defaultChecked className="rounded" />
              <label className="text-sm">Ativo</label>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <textarea name="descricao" rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); setEditingId(null); }}
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
            <button type="submit" disabled={loading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {loading ? "A guardar..." : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

