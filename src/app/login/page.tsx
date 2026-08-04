"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  HiOutlineArrowLeft,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineShieldCheck,
  HiOutlineChartBar,
  HiOutlineClock,
  HiOutlineDocumentReport,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { toast } from "sonner";

const features = [
  {
    icon: HiOutlineDocumentReport,
    title: "Relatórios em tempo real",
    description: "Acompanhe exames e resultados com precisão",
  },
  {
    icon: HiOutlineUserGroup,
    title: "Gestão de pacientes",
    description: "Histórico completo e organizado",
  },
  {
    icon: HiOutlineChartBar,
    title: "Análises avançadas",
    description: "Métricas e estatísticas do serviço",
  },
  {
    icon: HiOutlineClock,
    title: "Escalas de turnos",
    description: "Organização eficiente da equipa",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou password incorretos");
        toast.error("Email ou password incorretos");
      } else if (result?.ok) {
        toast.success("Login realizado com sucesso!");
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
      toast.error("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background">
      {/* Fundo decorativo com gradientes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-200/40 blur-[120px] dark:bg-blue-600/20" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-200/30 blur-[120px] dark:bg-cyan-500/10" />
        <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-200/30 blur-[100px] dark:bg-indigo-500/10" />
        {/* Grid pattern sutil que adapta ao tema */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Botões superiores */}
      <div className="absolute left-6 top-6 z-20 flex items-center gap-3">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:border-primary/30 hover:bg-card hover:text-foreground"
        >
          <HiOutlineArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Voltar
        </Link>
        <ThemeToggle />
      </div>

      <div className="relative z-10 grid w-full lg:grid-cols-2">
        {/* ─── Painel esquerdo - Branding ─── */}
        <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
          {/* Logo e nome */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
              <svg width="28" height="28" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32 12C26.5 12 22 16.5 22 22V42C22 47.5 26.5 52 32 52C37.5 52 42 47.5 42 42V22C42 16.5 37.5 12 32 12Z" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
                <path d="M22 28H42" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <path d="M22 36H42" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                <circle cx="32" cy="22" r="3.5" fill="#93C5FD"/>
                <circle cx="32" cy="42" r="3.5" fill="#93C5FD"/>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Imagiologia</h2>
              <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
            </div>
          </div>

          {/* Conteúdo central */}
          <div className="max-w-md">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <HiOutlineShieldCheck className="h-3.5 w-3.5" />
              Plataforma segura e confiável
            </div>
            <h1 className="text-4xl font-bold leading-tight text-foreground">
              Gestão completa do seu{" "}
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
                serviço de imagiologia
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              Centralize exames, pacientes, relatórios e escalas numa única
              plataforma moderna e eficiente.
            </p>

            {/* Features */}
            <div className="mt-10 grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="animate-fade-in rounded-2xl border bg-card/50 p-4 backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-card"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <feature.icon className="mb-3 h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground/60">
            <span>© 2026 Imagiologia</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>v1.0</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>Angola</span>
          </div>
        </div>

        {/* ─── Painel direito - Formulário ─── */}
        <div className="flex min-h-screen items-center justify-center p-6 sm:p-8 lg:min-h-0">
          <div className="w-full max-w-md animate-scale-in">
            {/* Card do formulário */}
            <div className="rounded-3xl border bg-card/70 p-8 shadow-2xl shadow-black/10 backdrop-blur-xl sm:p-10 dark:shadow-black/40">
              {/* Logo mobile */}
              <div className="mb-8 flex flex-col items-center lg:hidden">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30">
                  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M32 12C26.5 12 22 16.5 22 22V42C22 47.5 26.5 52 32 52C37.5 52 42 47.5 42 42V22C42 16.5 37.5 12 32 12Z" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round"/>
                    <path d="M22 28H42" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M22 36H42" stroke="white" strokeWidth="4" strokeLinecap="round"/>
                    <circle cx="32" cy="22" r="3.5" fill="#93C5FD"/>
                    <circle cx="32" cy="42" r="3.5" fill="#93C5FD"/>
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  Sistema de Imagiologia
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Faça login para continuar
                </p>
              </div>

              {/* Título desktop */}
              <div className="mb-8 hidden lg:block">
                <h1 className="text-2xl font-bold text-foreground">
                  Bem-vindo de volta
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Entre com as suas credenciais para aceder ao sistema
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <div className="group relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="seu@email.com"
                      className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-foreground"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      className="text-xs font-medium text-blue-400 transition-colors hover:text-blue-300"
                    >
                      Esqueceu a password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-input bg-background/50 px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:border-primary/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                      aria-label={showPassword ? "Ocultar password" : "Mostrar password"}
                    >
                      {showPassword ? (
                        <HiOutlineEyeOff className="h-4 w-4" />
                      ) : (
                        <HiOutlineEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="animate-fade-in rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:hover:brightness-100"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      A entrar...
                    </span>
                  ) : (
                    "Entrar no sistema"
                  )}
                </button>
              </form>

              {/* Separador */}
              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground/60">ou</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Acesso rápido */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Precisa de ajuda?{" "}
                  <button
                    type="button"
                    className="font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Contacte o administrador
                  </button>
                </p>
              </div>
            </div>

            {/* Rodapé mobile */}
            <p className="mt-6 text-center text-xs text-muted-foreground/60 lg:hidden">
              Sistema de Gestão de Imagiologia v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}