"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { HiOutlinePlus, HiOutlineSearch, HiOutlinePencil, HiOutlineTrash } from "react-icons/hi";
import { toast } from "sonner";
import { eliminarPaciente } from "@/server/actions/pacientes-actions";
import { formatDate } from "@/utils/format";
import { usePermissoes } from "@/hooks/use-permissoes";

interface Paciente {
  id: number;
  nome: string;
  nif: string | null;
  telefone: string | null;
  email: string | null;
  sexo: string | null;
  dataNascimento: string | null;
  _count: { exames: number };
}

interface PacientesClientProps {
  initialData: {
    data: Paciente[];
    total: number;
    pages: number;
    currentPage: number;
  };
}

export function PacientesClient({ initialData }: PacientesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pode } = usePermissoes();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [data, setData] = useState(initialData);

  const handleSearch = useCallback(
    async (value: string) => {
      setSearch(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("search", value);
      else params.delete("search");
      params.set("page", "1");
      router.push(`/pacientes?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleDelete = async (id: number, nome: string) => {
    if (!confirm(`Tem a certeza que deseja eliminar o paciente "${nome}"?`)) return;
    try {
      await eliminarPaciente(id);
      toast.success("Paciente eliminado com sucesso");
      router.refresh();
    } catch {
      toast.error("Erro ao eliminar paciente");
    }
  };

  const prevPageHref = "/pacientes?" + new URLSearchParams({
    page: String(data.currentPage - 1),
    ...(search ? { search } : {}),
  }).toString();
  const nextPageHref = "/pacientes?" + new URLSearchParams({
    page: String(data.currentPage + 1),
    ...(search ? { search } : {}),
  }).toString();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            {data.total} paciente(s) registado(s)
          </p>
        </div>
        {pode("pacientes", "criar") && (
          <Link
            href="/pacientes/novo"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <HiOutlinePlus className="h-4 w-4" />
            Novo Paciente
          </Link>
        )}
      </div>

      <div className="relative max-w-md">
        <HiOutlineSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Pesquisar por nome, NIF, telefone..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nome</th>
                <th className="px-4 py-3 text-left font-medium">NIF</th>
                <th className="px-4 py-3 text-left font-medium">Telefone</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-center font-medium">Exames</th>
                <th className="px-4 py-3 text-right font-medium">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {data.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    Nenhum paciente encontrado
                  </td>
                </tr>
              ) : (
                data.data.map((paciente) => (
                  <tr key={paciente.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/pacientes/${paciente.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {paciente.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{paciente.nif || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{paciente.telefone || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{paciente.email || "-"}</td>
                    <td className="px-4 py-3 text-center">{paciente._count.exames}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {pode("pacientes", "editar") && (
                          <Link
                            href={`/pacientes/${paciente.id}/editar`}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent"
                          >
                            <HiOutlinePencil className="h-4 w-4" />
                          </Link>
                        )}
                        {pode("pacientes", "eliminar") && (
                          <button
                            onClick={() => handleDelete(paciente.id, paciente.nome)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Pagina {data.currentPage} de {data.pages}
            </p>
            <div className="flex gap-2">
              {data.currentPage > 1 && (
                <Link
                  href={prevPageHref}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  Anterior
                </Link>
              )}
              {data.currentPage < data.pages && (
                <Link
                  href={nextPageHref}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-accent"
                >
                  Proxima
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
