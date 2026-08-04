"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { criarExame } from "@/server/actions/exames-actions";
import {
  ArrowLeft,
  Loader2,
  Search,
  Calendar,
  Building2,
  Microscope,
  User,
  X,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { formatDate, formatDateTime } from "@/utils/format";

interface SelectOption {
  id: number;
  nome: string;
  numeroProcesso?: string;
}

interface AgendamentoOption {
  id: number;
  codigo: string | null;
  pacienteId: number;
  tipoExameId: number;
  tecnicoId: number | null;
  procedenciaId: number | null;
  medicoSolicitante: string | null;
  observacao: string | null;
  estado: string;
  dataExame: string;
  paciente: { id: number; nome: string; numeroProcesso: string };
  tipoExame: { id: number; nome: string; modalidade: string | null };
  tecnico: { id: number; nome: string } | null;
  procedencia: { id: number; nome: string } | null;
}

interface NovoExameFormProps {
  pacientes: SelectOption[];
  tiposExame: SelectOption[];
  tecnicos: SelectOption[];
  procedencias: SelectOption[];
  agendamentos: AgendamentoOption[];
}

export function NovoExameForm({
  pacientes,
  tiposExame,
  tecnicos,
  procedencias,
  agendamentos,
}: NovoExameFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [searchAgendamento, setSearchAgendamento] = useState("");
  const [showAgendamentos, setShowAgendamentos] = useState(false);
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoOption | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Refs para os campos do formulario
  const pacienteRef = useRef<HTMLSelectElement>(null);
  const tipoExameRef = useRef<HTMLSelectElement>(null);
  const procedenciaRef = useRef<HTMLSelectElement>(null);
  const tecnicoRef = useRef<HTMLSelectElement>(null);
  const medicoRef = useRef<HTMLInputElement>(null);
  const obsRef = useRef<HTMLTextAreaElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowAgendamentos(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const agendamentosFiltrados = useMemo(() => {
    if (!searchAgendamento.trim()) return agendamentos.slice(0, 20);
    const q = searchAgendamento.toLowerCase();
    return agendamentos.filter(
      (a) =>
        a.paciente.nome.toLowerCase().includes(q) ||
        a.tipoExame.nome.toLowerCase().includes(q) ||
        a.codigo?.toLowerCase().includes(q) ||
        a.procedencia?.nome.toLowerCase().includes(q) ||
        a.medicoSolicitante?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [agendamentos, searchAgendamento]);

  const preencherFormulario = (agendamento: AgendamentoOption) => {
    setAgendamentoSelecionado(agendamento);
    setShowAgendamentos(false);
    setSearchAgendamento("");

    // Preencher campos do formulario
    if (pacienteRef.current) pacienteRef.current.value = String(agendamento.pacienteId);
    if (tipoExameRef.current) tipoExameRef.current.value = String(agendamento.tipoExameId);
    if (procedenciaRef.current && agendamento.procedenciaId) {
      procedenciaRef.current.value = String(agendamento.procedenciaId);
    }
    if (tecnicoRef.current && agendamento.tecnicoId) {
      tecnicoRef.current.value = String(agendamento.tecnicoId);
    }
    if (medicoRef.current && agendamento.medicoSolicitante) {
      medicoRef.current.value = agendamento.medicoSolicitante;
    }
    if (obsRef.current && agendamento.observacao) {
      obsRef.current.value = agendamento.observacao;
    }

    toast.success("Agendamento carregado! Campos preenchidos automaticamente.");
  };

  const limparSelecao = () => {
    setAgendamentoSelecionado(null);
    if (pacienteRef.current) pacienteRef.current.value = "";
    if (tipoExameRef.current) tipoExameRef.current.value = "";
    if (procedenciaRef.current) procedenciaRef.current.value = "";
    if (tecnicoRef.current) tecnicoRef.current.value = "";
    if (medicoRef.current) medicoRef.current.value = "";
    if (obsRef.current) obsRef.current.value = "";
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      pacienteId: Number(formData.get("pacienteId")),
      tipoExameId: Number(formData.get("tipoExameId")),
      tecnicoId: formData.get("tecnicoId") ? Number(formData.get("tecnicoId")) : null,
      procedenciaId: formData.get("procedenciaId") ? Number(formData.get("procedenciaId")) : null,
      medicoSolicitante: (formData.get("medicoSolicitante") as string) || null,
      observacao: (formData.get("observacao") as string) || null,
      estado: "Pendente",
    };

    try {
      await criarExame(data);
      toast.success("Exame criado com sucesso!");

      // Se veio de um agendamento, marcar como realizado
      if (agendamentoSelecionado) {
        toast.success("Agendamento marcado como realizado!");
      }

      router.push("/exames");
    } catch {
      toast.error("Erro ao criar exame. Verifique os dados.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <Link
          href="/exames"
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Novo Exame</h1>
          <p className="text-sm text-muted-foreground">
            {agendamentoSelecionado
              ? "Exame baseado num agendamento existente"
              : "Registar um novo exame ou preencher a partir de um agendamento"}
          </p>
        </div>
      </div>

      {/* Seccao de pesquisa de agendamentos */}
      <div className="rounded-xl border bg-card p-5" ref={searchRef}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Pesquisar Agendamento</h2>
          </div>
          {agendamentoSelecionado && (
            <button
              onClick={limparSelecao}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
              Limpar selecao
            </button>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Pesquisar por paciente, exame, unidade, medico..."
            value={searchAgendamento}
            onChange={(e) => {
              setSearchAgendamento(e.target.value);
              setShowAgendamentos(true);
            }}
            onFocus={() => setShowAgendamentos(true)}
            className="w-full rounded-lg border bg-background py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Agendamento selecionado */}
        {agendamentoSelecionado && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-lg border-l-4 border-l-primary bg-primary/5 p-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {agendamentoSelecionado.paciente.nome}
                </p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Microscope className="h-3 w-3" />
                    {agendamentoSelecionado.tipoExame.nome}
                  </span>
                  {agendamentoSelecionado.procedencia && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {agendamentoSelecionado.procedencia.nome}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(agendamentoSelecionado.dataExame)}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-medium text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full px-2 py-0.5">
                Selecionado
              </span>
            </div>
          </motion.div>
        )}

        {/* Dropdown de resultados */}
        <AnimatePresence>
          {showAgendamentos && !agendamentoSelecionado && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute z-50 mt-1 w-[calc(100%-2.5rem)] rounded-xl border bg-card shadow-xl max-h-72 overflow-y-auto"
            >
              {agendamentosFiltrados.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Nenhum agendamento pendente encontrado
                </div>
              ) : (
                agendamentosFiltrados.map((agendamento) => (
                  <button
                    key={agendamento.id}
                    type="button"
                    onClick={() => preencherFormulario(agendamento)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors border-b last:border-0"
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {agendamento.paciente.nome}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Microscope className="h-3 w-3" />
                          {agendamento.tipoExame.nome}
                        </span>
                        {agendamento.procedencia && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {agendamento.procedencia.nome}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(agendamento.dataExame)}
                        </span>
                        {agendamento.tecnico && (
                          <span className="text-xs text-muted-foreground">
                            Tec: {agendamento.tecnico.nome}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-primary shrink-0 mt-1">
                      Preencher
                    </span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!agendamentoSelecionado && agendamentos.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {agendamentos.length} agendamento(s) pendente(s) disponiveis para preenchimento automatico
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="rounded-xl border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Paciente */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Paciente *</label>
              <select
                ref={pacienteRef}
                name="pacienteId"
                required
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Selecionar paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} {p.numeroProcesso ? `(#${p.numeroProcesso})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Exame */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Exame *</label>
              <select
                ref={tipoExameRef}
                name="tipoExameId"
                required
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Selecionar...</option>
                {tiposExame.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Procedência */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Procedência</label>
              <select
                ref={procedenciaRef}
                name="procedenciaId"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Selecionar...</option>
                {procedencias.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Técnico */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Técnico</label>
              <select
                ref={tecnicoRef}
                name="tecnicoId"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="">Selecionar...</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Médico solicitante */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Médico Solicitante</label>
              <input
                ref={medicoRef}
                name="medicoSolicitante"
                placeholder="Dr. Nome do médico"
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Observação */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Observação</label>
              <textarea
                ref={obsRef}
                name="observacao"
                rows={3}
                placeholder="Informações adicionais sobre o exame..."
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "A guardar..." : "Guardar Exame"}
          </button>
          <Link
            href="/exames"
            className="rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </motion.div>
  );
}
