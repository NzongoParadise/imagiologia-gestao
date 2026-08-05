"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  DatabaseBackup,
  Download,
  Upload,
  Trash2,
  RotateCcw,
  Plus,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Backup {
  id: number;
  nome: string;
  tipo: string;
  tamanho: number;
  numRegistos: number;
  criadoEm: string;
  criadoPor?: { nome: string; email: string } | null;
}

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BackupSection() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) {
        throw new Error("Erro ao listar backups");
      }
      const data = await res.json();
      setBackups(data);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao listar backups");
    } finally {
      setLoading(false);
    }
  }, []);

useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const res = await fetch("/api/backup");
        if (!ativo) return;
        if (!res.ok) {
          throw new Error("Erro ao listar backups");
        }
        const data = await res.json();
        setBackups(data);
      } catch (error) {
        console.error(error);
        if (ativo) toast.error("Erro ao listar backups");
      } finally {
        if (ativo) setLoading(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const criarBackup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/backup", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao criar backup");
      }
      const data = await res.json();
      toast.success("Backup criado com sucesso");
      // Download automático do backup criado
      if (data.dadosBase64) {
        baixarBackup(data.nome, data.dadosBase64);
      }
      await carregar();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao criar backup";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const baixarBackup = (nome: string, dadosBase64: string) => {
    const bytes = Uint8Array.from(atob(dadosBase64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nome;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const descarregar = async (id: number, nome: string) => {
    try {
      const res = await fetch(`/api/backup/${id}`);
      if (!res.ok) throw new Error("Erro ao descarregar");
      const data = await res.json();
      if (data.dadosBase64) {
        baixarBackup(nome, data.dadosBase64);
      }
    } catch {
      toast.error("Erro ao descarregar backup");
    }
  };

  const restaurar = async (id: number) => {
    if (!window.confirm("Restaurar a base de dados a partir deste backup? Esta ação substituirá todos os dados atuais.")) {
      return;
    }
    setRestoringId(id);
    try {
      const res = await fetch(`/api/backup/${id}/restaurar`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao restaurar");
      toast.success("Base de dados restaurada com sucesso");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao restaurar";
      toast.error(msg);
    } finally {
      setRestoringId(null);
    }
  };

  const apagar = async (id: number) => {
    if (!window.confirm("Apagar este backup?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/backup/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao apagar");
      toast.success("Backup apagado");
      await carregar();
    } catch {
      toast.error("Erro ao apagar backup");
    } finally {
      setDeletingId(null);
    }
  };

  const restaurarFicheiro = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/backup/restaurar", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao restaurar ficheiro");
      toast.success("Base de dados restaurada com sucesso");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro ao restaurar";
      toast.error(msg);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Ações principais */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={criarBackup}
          disabled={creating}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {creating ? "A criar..." : "Criar Backup Agora"}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <Upload className="h-4 w-4" />
          Restaurar de Ficheiro
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={restaurarFicheiro}
        />

        <button
          onClick={carregar}
          className="flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Histórico */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-5 py-4">
          <h3 className="font-semibold">Histórico de Backups</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Backups manuais e automáticos da base de dados
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <DatabaseBackup className="h-8 w-8" />
            <p className="text-sm">Nenhum backup criado ainda</p>
          </div>
        ) : (
          <div className="divide-y">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{backup.nome}</span>
                    <span
                      className={cnTip(backup)}
                    >
                      {backup.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatarData(backup.criadoEm)} · {formatarTamanho(backup.tamanho)} ·{" "}
                    {backup.numRegistos} registos
                    {backup.criadoPor ? ` · ${backup.criadoPor.nome}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => descarregar(backup.id, backup.nome)}
                    title="Descarregar"
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => restaurar(backup.id)}
                    disabled={restoringId === backup.id}
                    title="Restaurar"
                    className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    {restoringId === backup.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => apagar(backup.id)}
                    disabled={deletingId === backup.id}
                    title="Apagar"
                    className="rounded-lg p-2 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/30"
                  >
                    {deletingId === backup.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper para o badge de tipo
function cnTip(backup: Backup): string {
  return backup.tipo === "automatico"
    ? "rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
    : "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
}
