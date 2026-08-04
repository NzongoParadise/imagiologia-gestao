"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserCog, Search, Shield, ShieldOff } from "lucide-react";
import { cn } from "@/utils/cn";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissoes } from "@/hooks/use-permissoes";

interface Utilizador {
  id: number;
  nome: string;
  email: string;
  role: string;
  ativo: boolean;
  createdAt: string;
}

interface UtilizadoresClientProps {
  utilizadores: Utilizador[];
}

export function UtilizadoresClient({ utilizadores }: UtilizadoresClientProps) {
  const router = useRouter();
  const { pode } = usePermissoes();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const filtered = utilizadores.filter(
    (u) =>
      u.nome.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string || undefined,
      role: formData.get("role") as string,
      ativo: formData.get("ativo") === "on",
    };

    try {
      if (editingId) {
        const res = await fetch(`/api/auth/utilizadores/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        toast.success("Utilizador atualizado");
      } else {
        const res = await fetch("/api/auth/utilizadores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        toast.success("Utilizador criado");
      }
      setModalOpen(false);
      setEditingId(null);
      router.refresh();
    } catch {
      toast.error("Erro ao guardar utilizador");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(id: number, ativo: boolean) {
    try {
      await fetch(`/api/auth/utilizadores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativo }),
      });
      toast.success(ativo ? "Utilizador desativado" : "Utilizador ativado");
      router.refresh();
    } catch {
      toast.error("Erro ao alterar estado");
    }
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    TECNICO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    RECEPCAO: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Utilizadores</h1>
          <p className="text-sm text-muted-foreground">{utilizadores.length} utilizador(es)</p>
        </div>
        {pode("utilizadores", "criar") && (
          <button onClick={() => { setEditingId(null); setModalOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" /> Novo Utilizador
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input type="text" placeholder="Pesquisar utilizadores..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<UserCog className="h-8 w-8" />} title="Nenhum utilizador" description="Adicione utilizadores ao sistema"
          action={pode("utilizadores", "criar") ? (
            <button onClick={() => { setEditingId(null); setModalOpen(true); }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">Adicionar</button>
          ) : undefined} />
      ) : (
        <div className="space-y-3">
          {filtered.map((user) => (
            <div key={user.id} className="flex items-center gap-4 rounded-xl border bg-card p-4 hover:shadow-sm transition-shadow">
              <Avatar name={user.nome} size="md" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{user.nome}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                  roleColors[user.role] || "bg-muted text-muted-foreground")}>
                  {user.role}
                </span>
                <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                  user.ativo ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
                  {user.ativo ? "Ativo" : "Inativo"}
                </span>
                {pode("utilizadores", "editar") && (
                  <button onClick={() => handleToggleStatus(user.id, user.ativo)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent transition-colors" title={user.ativo ? "Desativar" : "Ativar"}>
                    {user.ativo ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                  </button>
                )}
                {pode("utilizadores", "eliminar") && (
                  <button onClick={async () => {
                    if (!confirm(`Eliminar utilizador "${user.nome}"?`)) return;
                    try {
                      await fetch(`/api/auth/utilizadores/${user.id}`, { method: "DELETE" });
                      toast.success("Utilizador eliminado");
                      router.refresh();
                    } catch { toast.error("Erro ao eliminar"); }
                  }} className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); }}
        title={editingId ? "Editar Utilizador" : "Novo Utilizador"} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome *</label>
            <input name="nome" required className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email *</label>
            <input name="email" type="email" required className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
          </div>
          {!editingId && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Password *</label>
              <input name="password" type="password" required className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Função</label>
            <select name="role" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30">
              <option value="TECNICO">Técnico</option>
              <option value="ADMIN">Administrador</option>
              <option value="RECEPCAO">Receção</option>
            </select>
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

