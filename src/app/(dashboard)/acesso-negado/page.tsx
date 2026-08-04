import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AcessoNegadoPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10">
        <ShieldAlert className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold">Acesso Negado</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Não tem permissão para aceder a esta secção. Se acha que isto é um
        erro, contacte o administrador do sistema.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  );
}

