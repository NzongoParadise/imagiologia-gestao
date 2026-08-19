"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Stethoscope,
  Activity,
  CheckCircle2,
  Users,
  Settings,
  Filter,
  Check,
  DoorOpen,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { usePermissoes } from "@/hooks/use-permissoes";
import {
  listarConsultorios,
  criarConsultorio,
} from "@/server/actions/consultorio-actions";

interface Especialidade {
  id: number;
  nome: string;
}

interface Consultorio {
  id: number;
  numero: string;
  nome: string;
  especialidadeId?: number | null;
  especialidade?: {
    id: number;
    nome: string;
  } | null;
  ativo: boolean;
  bloco?: string | null;
  andar?: string | null;
  capacidade?: number;
  equipamentos?: string | null;
  atendimentos?: Array<{
    id: number;
    estado: string;
    paciente?: { nome: string };
  }>;
  agendamentos?: Array<{
    id: number;
    estado: string;
  }>;
}

export default function ConsultoriosPage() {
  const router = useRouter();
  const { pode } = usePermissoes();

  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtroEspecialidade, setFiltroEspecialidade] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  // Modal Novo Consultório
  const [modalNovoOpen, setModalNovoOpen] = useState(false);
  const [numero, setNumero] = useState("");
  const [nome, setNome] = useState("");
  const [especialidadeId, setEspecialidadeId] = useState("");
  const [bloco, setBloco] = useState("Bloco A");
  const [andar, setAndar] = useState("Piso 1");
  const [capacidade, setCapacidade] = useState("1");
  const [equipamentos, setEquipamentos] = useState("");

  const carregarDados = async () => {
    setLoading(true);
    try {
      const [dadosConsultorios, respEsp] = await Promise.all([
        listarConsultorios(),
        fetch("/api/consultorios/especialidades").catch(() => null),
      ]);
      setConsultorios((dadosConsultorios || []) as unknown as Consultorio[]);

      // Carregar especialidades da base de dados via API ou extrair dos consultórios
      try {
        const res = await fetch("/api/v1/atendimento?tipo=especialidades");
        if (res.ok) {
          const espData = await res.json();
          if (Array.isArray(espData)) setEspecialidades(espData);
        }
      } catch {
        // Fallback
      }
    } catch (error) {
      console.error("Erro ao carregar consultórios:", error);
      toast.error("Erro ao carregar lista de consultórios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // Calcular próximo número sugerido (ex: Cons-09)
  const sugestaoProximoNumero = useMemo(() => {
    if (consultorios.length === 0) return "Cons-01";
    const numeros = consultorios
      .map((c) => {
        const m = c.numero.match(/(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => n > 0);
    const max = numeros.length > 0 ? Math.max(...numeros) : consultorios.length;
    return `Cons-${String(max + 1).padStart(2, "0")}`;
  }, [consultorios]);

  const handleAbrirModalNovo = () => {
    setNumero(sugestaoProximoNumero);
    setNome("");
    setEspecialidadeId("");
    setBloco("Bloco A");
    setAndar("Piso 1");
    setCapacidade("1");
    setEquipamentos("");
    setModalNovoOpen(true);
  };

  const handleCriarConsultorio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim() || !nome.trim()) {
      toast.error("Preencha o número e nome do consultório.");
      return;
    }

    setSubmitting(true);
    try {
      await criarConsultorio({
        numero: numero.trim(),
        nome: nome.trim(),
        especialidadeId: especialidadeId ? Number(especialidadeId) : undefined,
        bloco: bloco.trim() || undefined,
        andar: andar.trim() || undefined,
        capacidade: parseInt(capacidade, 10) || 1,
        equipamentos: equipamentos.trim() || undefined,
      });

      toast.success("Consultório registado com sucesso!");
      setModalNovoOpen(false);
      await carregarDados();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar consultório.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtragem
  const consultoriosFiltrados = useMemo(() => {
    return consultorios.filter((c) => {
      const matchBusca =
        !busca.trim() ||
        c.numero.toLowerCase().includes(busca.toLowerCase()) ||
        c.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (c.especialidade?.nome &&
          c.especialidade.nome.toLowerCase().includes(busca.toLowerCase())) ||
        (c.bloco && c.bloco.toLowerCase().includes(busca.toLowerCase()));

      const matchEsp =
        filtroEspecialidade === "todas" ||
        (c.especialidadeId && String(c.especialidadeId) === filtroEspecialidade);

      const matchStatus =
        filtroStatus === "todos" ||
        (filtroStatus === "ativo" && c.ativo) ||
        (filtroStatus === "inativo" && !c.ativo);

      return matchBusca && matchEsp && matchStatus;
    });
  }, [consultorios, busca, filtroEspecialidade, filtroStatus]);

  // Estatísticas
  const totalConsultorios = consultorios.length;
  const totalAtivos = consultorios.filter((c) => c.ativo).length;
  const totalConsultasEmCurso = consultorios.reduce(
    (acc, c) => acc + (c.atendimentos?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-primary" />
            Gestão de Consultórios e Gabinetes
          </h1>
          <p className="text-sm text-muted-foreground">
            Alocação de salas clínicas, especialidades médicas e controle de capacidade
          </p>
        </div>
        {pode("atendimento", "criar") && (
          <Button
            onClick={handleAbrirModalNovo}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Novo Consultório
          </Button>
        )}
      </div>

      {/* Cartões de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalConsultorios}</p>
              <p className="text-xs text-muted-foreground">Total de Gabinetes Registados</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalAtivos}</p>
              <p className="text-xs text-muted-foreground">Consultórios Ativos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalConsultasEmCurso}</p>
              <p className="text-xs text-muted-foreground">Atendimentos Ativos Hoje</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por número da sala, nome, especialidade ou bloco..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="px-3 py-2.5 text-xs rounded-xl border border-input bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="todos">Todos os Estados</option>
            <option value="ativo">Apenas Ativos</option>
            <option value="inativo">Apenas Inativos</option>
          </select>

          <Link href="/atendimento/consultas">
            <Button variant="outline" className="text-xs">
              <Stethoscope className="h-3.5 w-3.5 mr-1.5" /> Abrir Consulta
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid de Consultórios */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">A carregar consultórios...</p>
        </div>
      ) : consultoriosFiltrados.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Building2 className="h-8 w-8 text-muted-foreground" />}
            title="Nenhum consultório encontrado"
            description="Não foram encontrados consultórios com os critérios de pesquisa fornecidos."
            action={
              pode("atendimento", "criar") && (
                <Button onClick={handleAbrirModalNovo} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="h-4 w-4 mr-1.5" /> Adicionar Consultório
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {consultoriosFiltrados.map((c) => (
            <Card
              key={c.id}
              className="hover:border-primary/50 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                      {c.numero}
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {c.nome}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs mt-0.5">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {c.bloco || "Bloco Principal"} • {c.andar || "Piso 1"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={c.ativo ? "success" : "secondary"}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-1">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5 text-primary" /> Especialidade:
                    </span>
                    <span className="font-semibold text-foreground">
                      {c.especialidade?.nome || "Uso Geral / Multidisciplinar"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-blue-600" /> Capacidade:
                    </span>
                    <span className="font-medium text-foreground">
                      {c.capacidade || 1} profissional em simultâneo
                    </span>
                  </div>

                  {c.equipamentos && (
                    <p className="text-[11px] text-muted-foreground line-clamp-1 italic px-1">
                      Equipamentos: {c.equipamentos}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t text-xs">
                  <span className="text-muted-foreground">
                    Atendimentos hoje:{" "}
                    <strong className="text-foreground">
                      {c.atendimentos?.length || 0}
                    </strong>
                  </span>
                  <Link
                    href={`/atendimento/consultas`}
                    className="font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    Iniciar Atendimento <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL NOVO CONSULTÓRIO                                                    */}
      {/* ========================================================================= */}
      <Modal
        open={modalNovoOpen}
        onClose={() => setModalNovoOpen(false)}
        title="Registar Novo Consultório"
        description="Adicionar um novo gabinete ou sala de atendimento ao sistema hospitalar"
        size="md"
      >
        <form onSubmit={handleCriarConsultorio} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Código / Número *
              </label>
              <input
                type="text"
                required
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ex: Cons-09, Sala-12"
                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Capacidade Simultânea
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={capacidade}
                onChange={(e) => setCapacidade(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">
              Nome do Consultório / Sala *
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Consultório de Neurologia e EEG"
              className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Bloco Hospitalar
              </label>
              <select
                value={bloco}
                onChange={(e) => setBloco(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Bloco A">Bloco A (Clínica Geral / Pediatria)</option>
                <option value="Bloco B">Bloco B (Cardiologia / Gineco)</option>
                <option value="Bloco C">Bloco C (Ortopedia / Cirurgia)</option>
                <option value="Bloco Central">Bloco Central</option>
                <option value="Edifício de Imagiologia">Edifício de Imagiologia</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-foreground">
                Andar / Piso
              </label>
              <select
                value={andar}
                onChange={(e) => setAndar(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Piso 0">Piso 0 (Rés do Chão)</option>
                <option value="Piso 1">Piso 1</option>
                <option value="Piso 2">Piso 2</option>
                <option value="Piso 3">Piso 3</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-foreground">
              Equipamentos Disponíveis (opcional)
            </label>
            <input
              type="text"
              value={equipamentos}
              onChange={(e) => setEquipamentos(e.target.value)}
              placeholder="Ex: Maca articulada, Monitor Multiparamétrico, Ecógrafo portátil"
              className="w-full px-3 py-2 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalNovoOpen(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-32"
            >
              {submitting ? "A gravar..." : "Registar Sala"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
