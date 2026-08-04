import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  HiOutlineFilm,
  HiOutlineCalendar,
  HiOutlineUserGroup,
  HiOutlineDocumentReport,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineCheckCircle,
} from "react-icons/hi";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
      {/* Navbar */}
      <header className="glass sticky top-0 z-50 border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Logo Sistema de Imagiologia"
              width={40}
              height={40}
              className="rounded-xl"
              priority
            />
            <div>
              <p className="text-sm font-bold leading-tight">Imagiologia</p>
              <p className="text-xs text-muted-foreground">Sistema de Gestão</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#recursos" className="transition-colors hover:text-foreground">
              Recursos
            </a>
            <a href="#sobre" className="transition-colors hover:text-foreground">
              Sobre
            </a>
            <a href="#contacto" className="transition-colors hover:text-foreground">
              Contacto
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow-md"
            >
              Acessar Sistema
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-health/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-in">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <HiOutlineShieldCheck className="h-4 w-4 text-health" />
                Plataforma profissional de imagiologia
              </div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Gestão completa de{" "}
                <span className="bg-gradient-to-r from-primary to-health bg-clip-text text-transparent">
                  exames de imagiologia
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Sistema moderno e intuitivo para gestão de pacientes, exames,
                técnicos, agendamentos e relatórios — tudo num só lugar.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl"
                >
                  Acessar o Sistema
                  <HiOutlineArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#recursos"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border bg-card px-6 py-3 text-sm font-semibold transition-colors hover:bg-secondary"
                >
                  Conhecer Recursos
                </a>
              </div>
              <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <HiOutlineCheckCircle className="h-4 w-4 text-health" />
                  Seguro e confiável
                </span>
                <span className="inline-flex items-center gap-2">
                  <HiOutlineCheckCircle className="h-4 w-4 text-health" />
                  Interface moderna
                </span>
                <span className="inline-flex items-center gap-2">
                  <HiOutlineCheckCircle className="h-4 w-4 text-health" />
                  Suporte completo
                </span>
              </div>
            </div>

            {/* Logo Card */}
            <div className="relative animate-scale-in">
              <div className="absolute inset-0 -rotate-6 rounded-3xl bg-gradient-to-br from-primary/20 to-health/20 blur-2xl" />
              <div className="relative rounded-3xl border bg-card p-8 shadow-2xl">
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 animate-pulse rounded-3xl bg-primary/20 blur-2xl" />
                    <Image
                      src="/logo.svg"
                      alt="Logo Sistema de Imagiologia"
                      width={160}
                      height={160}
                      className="relative rounded-3xl shadow-xl"
                      priority
                    />
                  </div>
                </div>
                <h2 className="mt-6 text-center text-2xl font-bold">
                  Sistema de Imagiologia
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                  Gestão profissional de exames e pacientes
                </p>
                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-lg font-bold text-primary">100%</p>
                    <p className="text-xs text-muted-foreground">Digital</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-lg font-bold text-primary">24/7</p>
                    <p className="text-xs text-muted-foreground">Disponível</p>
                  </div>
                  <div className="rounded-xl bg-secondary p-3">
                    <p className="text-lg font-bold text-primary">v1.0</p>
                    <p className="text-xs text-muted-foreground">Estável</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="border-t bg-card/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Tudo o que precisa para gerir a sua clínica
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Ferramentas completas para otimizar o fluxo de trabalho da sua
              unidade de imagiologia.
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: HiOutlineFilm,
                title: "Gestão de Exames",
                desc: "Registo e acompanhamento completo de todos os exames de imagiologia.",
              },
              {
                icon: HiOutlineUserGroup,
                title: "Pacientes",
                desc: "Cadastro e histórico detalhado de todos os pacientes da unidade.",
              },
              {
                icon: HiOutlineCalendar,
                title: "Agendamentos",
                desc: "Agende exames e gerencie turnos de forma eficiente e organizada.",
              },
              {
                icon: HiOutlineDocumentReport,
                title: "Relatórios",
                desc: "Gere relatórios profissionais e exporte em diversos formatos.",
              },
              {
                icon: HiOutlineChartBar,
                title: "Estatísticas",
                desc: "Acompanhe métricas e indicadores de desempenho da unidade.",
              },
              {
                icon: HiOutlineClock,
                title: "Histórico",
                desc: "Acesso rápido ao histórico completo de exames e procedimentos.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="card-hover group rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-slide-in-left">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Sobre o Sistema
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                O Sistema de Gestão de Imagiologia foi desenvolvido para
                modernizar e simplificar a gestão de unidades de imagiologia,
                oferecendo uma plataforma completa, segura e intuitiva para
                profissionais de saúde.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Interface moderna e responsiva",
                  "Segurança avançada com autenticação",
                  "Gestão integrada de pacientes e exames",
                  "Relatórios profissionais personalizáveis",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <HiOutlineCheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-health" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="animate-slide-in-right">
              <div className="rounded-3xl border bg-card p-8 shadow-xl">
                <div className="flex items-center gap-4">
                  <Image
                    src="/logo.svg"
                    alt="Logo"
                    width={64}
                    height={64}
                    className="rounded-2xl"
                  />
                  <div>
                    <h3 className="text-lg font-bold">Imagiologia Gestão</h3>
                    <p className="text-sm text-muted-foreground">
                      Plataforma profissional
                    </p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
                    <span className="text-sm text-muted-foreground">Versão</span>
                    <span className="text-sm font-semibold">1.0.0</span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-health">
                      <span className="h-2 w-2 rounded-full bg-health" />
                      Operacional
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3">
                    <span className="text-sm text-muted-foreground">Suporte</span>
                    <span className="text-sm font-semibold">24/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section id="contacto" className="border-t bg-card/50 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Image
            src="/logo.svg"
            alt="Logo"
            width={80}
            height={80}
            className="mx-auto mb-6 rounded-2xl shadow-lg"
          />
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Pronto para começar?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
            Acesse o sistema e comece a gerir a sua unidade de imagiologia de
            forma moderna e eficiente.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl"
          >
            Acessar o Sistema
            <HiOutlineArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <p className="text-sm font-medium">
              Sistema de Gestão de Imagiologia
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Imagiologia Gestão. Todos os direitos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}