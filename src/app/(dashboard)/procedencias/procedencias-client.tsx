"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Building2, Search } from "lucide-react";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { criarProcedencia, atualizarProcedencia, eliminarProcedencia } from "@/server/actions/procedencias-actions";
import { usePermissoes } from "@/hooks/use-permissoes";

interface Procedencia {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  _count: { exames: number };
}

interface ProcedenciasClientProps {
  procedencias: Procedencia[];
}

export function ProcedenciasClient({ procedencias }: ProcedenciasClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9;

  const filtered = procedencias.filter(
    (p) =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginaSegura = Math.min(currentPage, totalPages);
  const paginadas = filtered.slice(
    (paginaSegura - 1) * pageSize,
    (paginaSegura - 1) * pageSize + pageSize
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      descricao: (formData.get("descricao") as string) || null,
      ativo: formData.get("ativo") === "on",
    };

    try {
      if (editingId) {
        await atualizarProcedencia(editingId, data);
        toast.success("Procedência atualizada");
      } else {
        await criarProcedencia(data);
        toast.success("Procedência criada");
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
    if (!confirm(`Eliminar procedência "${nome}"?`)) return;
    try {
      await eliminarProcedencia(id);
      toast.success("Procedência eliminada");
      router.refresh();
    } catch {
      toast.error("Erro ao eliminar");
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Procedências</h1>
          <p className="text-sm text-muted-foreground">{procedencias.length} procedência(s)</p>
        </div>
        {pode("procedencias", "criar") && (
          <button onClick={() => { setEditingId(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Nova Procedência
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
<input type="text" placeholder="Pesquisar..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Building2 className="h-8 w-8" />} title="Nenhuma procedência"
          description="Adicione procedências como Urgência, Consulta Externa, etc."
          action={pode("procedencias", "criar") ? (
            <button onClick={() => { setEditingId(null); setModalOpen(true); }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Adicionar</button>
          ) : undefined} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {paginadas.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                    <Building2 className="h-5 w-5 text-violet-600" />
                  </div>
                  <h3 className="font-semibold">{p.nome}</h3>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium",
                  p.ativo ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
                  {p.ativo ? "Ativo" : "Inativo"}
                </span>
              </div>
              {p.descricao && <p className="text-sm text-muted-foreground mb-2">{p.descricao}</p>}
              <p className="text-xs text-muted-foreground">{p._count.exames} exame(s)</p>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                {pode("procedencias", "editar") && (
                  <button onClick={() => { setEditingId(p.id); setModalOpen(true); }}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors">
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </button>
                )}
                {pode("procedencias", "eliminar") && (
                  <button onClick={() => handleDelete(p.id, p.nome)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
<Trash2 className="h-3.5 w-3.5" /> Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <Pagination
          currentPage={paginaSegura}
          totalPages={totalPages}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }}
        title={editingId ? "Editar Procedência" : "Nova Procedência"} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome *</label>
            <input name="nome" required
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Descrição</label>
            <textarea name="descricao" rows={2}
              className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="flex items-center gap-2">
            <input name="ativo" type="checkbox" defaultChecked className="rounded" />
            <label className="text-sm">Ativo</label>
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

