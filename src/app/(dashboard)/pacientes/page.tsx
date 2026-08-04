import { listarPacientes } from "@/server/actions/pacientes-actions";
import { verificarPermissao } from "@/lib/permissions-server";
import { PacientesClient } from "./pacientes-client";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export default async function PacientesPage({ searchParams }: PageProps) {
  await verificarPermissao("pacientes");

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const data = await listarPacientes(page, 20, search);

  return <PacientesClient initialData={data} />;
}

