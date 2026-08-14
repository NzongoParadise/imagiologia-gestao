# Guia Prático - Implementações Recomendadas para Módulo 1

## 🎯 Objetivo
Fornecer código pronto para usar que resolve os 4 problemas críticos do Módulo 1.

---

## 1. Implementação: Busca Real de Pacientes

### 1.1 Criar API endpoint

**Arquivo:** `src/app/api/pacientes/search/route.ts`

```typescript
import { prisma } from "@/lib/db";
import { autorizar } from "@/lib/permissions-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await autorizar("pacientes", "ver");

    const searchParams = request.nextUrl.searchParams;
    const termo = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = 20;

    if (termo.length < 2) {
      return NextResponse.json({
        data: [],
        total: 0,
        pages: 0,
        page,
      });
    }

    const skip = (page - 1) * limit;

    const [pacientes, total] = await Promise.all([
      prisma.paciente.findMany({
        where: {
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { numeroProcesso: { contains: termo, mode: "insensitive" } },
            { nif: { contains: termo } },
            { bi: { contains: termo } },
          ],
        },
        select: {
          id: true,
          nome: true,
          numeroProcesso: true,
          dataNascimento: true,
          telefone: true,
        },
        orderBy: { nome: "asc" },
        skip,
        take: limit,
      }),
      prisma.paciente.count({
        where: {
          OR: [
            { nome: { contains: termo, mode: "insensitive" } },
            { numeroProcesso: { contains: termo, mode: "insensitive" } },
            { nif: { contains: termo } },
            { bi: { contains: termo } },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      data: pacientes,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error("Erro ao buscar pacientes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar pacientes" },
      { status: 500 }
    );
  }
}
```

### 1.2 Criar componente de combobox

**Arquivo:** `src/features/atendimento/components/seletor-paciente.tsx`

```typescript
"use client";

import { useCallback, useMemo, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Loader } from "lucide-react";
import { cn } from "@/utils/cn";

interface Paciente {
  id: number;
  nome: string;
  numeroProcesso: string | null;
  dataNascimento: string | null;
  telefone: string | null;
}

interface SeletorPacienteProps {
  value?: number;
  onSelect?: (paciente: Paciente) => void;
  placeholder?: string;
}

export function SeletorPaciente({
  value,
  onSelect,
  placeholder = "Procurar paciente...",
}: SeletorPacienteProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  // Buscar pacientes quando termo muda
  const buscarPacientes = useCallback(async () => {
    if (debouncedSearch.length < 2) {
      setPacientes([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/pacientes/search?q=${encodeURIComponent(debouncedSearch)}`
      );
      if (!response.ok) throw new Error("Erro ao buscar");
      const resultado = await response.json();
      setPacientes(resultado.data);
    } catch (error) {
      console.error("Erro:", error);
      setPacientes([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch]);

  // Executar busca quando termo muda
  useMemo(() => {
    buscarPacientes();
  }, [buscarPacientes]);

  const handleSelect = (paciente: Paciente) => {
    setSelectedPaciente(paciente);
    setOpen(false);
    onSelect?.(paciente);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedPaciente
            ? `${selectedPaciente.nome} (${selectedPaciente.numeroProcesso || "N/A"})`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          {isLoading && (
            <div className="p-4 text-center">
              <Loader className="inline h-4 w-4 animate-spin" />
            </div>
          )}
          <CommandEmpty>
            {searchTerm.length < 2
              ? "Digite pelo menos 2 caracteres"
              : "Nenhum paciente encontrado"}
          </CommandEmpty>
          <CommandGroup>
            {pacientes.map((paciente) => (
              <CommandItem
                key={paciente.id}
                value={String(paciente.id)}
                onSelect={() => handleSelect(paciente)}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedPaciente?.id === paciente.id
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                <div className="flex-1">
                  <div className="font-medium">{paciente.nome}</div>
                  <div className="text-xs text-gray-500">
                    {paciente.numeroProcesso} | {paciente.telefone || "S/N"}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

### 1.3 Integrar no formulário de consultas

**Arquivo:** `src/app/(dashboard)/atendimento/consultas/consultas-client.tsx`

**Substituir:**
```typescript
// ANTES - limitado a 100
const [pacienteId, setPacienteId] = useState("");

// Form paciente
{...}
<Select
  value={pacienteId}
  onValueChange={setPacienteId}
>
  {pacientes.map(p => <option key={p.id}>{p.nome}</option>)}
</Select>
```

**Por:**
```typescript
// DEPOIS - busca dinâmica
const [pacienteId, setPacienteId] = useState<number | null>(null);
const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

// Form paciente
{...}
<SeletorPaciente
  value={pacienteId || undefined}
  onSelect={(paciente) => {
    setPacienteId(paciente.id);
    setSelectedPaciente(paciente);
  }}
  placeholder="Procurar paciente por nome ou nº processo..."
/>
```

---

## 2. Implementação: Validar Conflito de Consultório

### 2.1 Adicionar verificação na action

**Arquivo:** `src/server/actions/atendimento-actions.ts`

**Adicionar função:**
```typescript
async function verificarConsultorioDisponivel(
  consultorioId: number,
  opcoes?: { excludeAtendimentoId?: number }
): Promise<{ disponivel: boolean; atendimentoEmCurso?: object }> {
  const emCurso = await prisma.atendimento.findFirst({
    where: {
      consultorioId,
      estado: { in: ["EM_TRIAGEM", "EM_ATENDIMENTO"] },
      id: opcoes?.excludeAtendimentoId
        ? { not: opcoes.excludeAtendimentoId }
        : undefined,
    },
    include: {
      paciente: { select: { id: true, nome: true } },
    },
  });

  return {
    disponivel: !emCurso,
    atendimentoEmCurso: emCurso || undefined,
  };
}

// Atualizar iniciarConsulta para validar
export async function iniciarConsulta(input: {
  pacienteId: number;
  especialidadeId?: number;
  consultorioId?: number;
  agendamentoId?: number;
  procedenciaId?: number;
  origem?: string;
  prioridade?: string;
  motivo?: string;
}) {
  const usuario = await autorizar("atendimento", "criar");

  if (!Number.isInteger(input.pacienteId) || input.pacienteId <= 0) {
    throw new Error("Selecione um paciente válido");
  }

  // ✅ NOVO: Validar consultório
  if (input.consultorioId) {
    const { disponivel, atendimentoEmCurso } =
      await verificarConsultorioDisponivel(input.consultorioId);

    if (!disponivel) {
      throw new Error(
        `Consultório ocupado por ${atendimentoEmCurso?.paciente.nome}`
      );
    }
  }

  // ... resto do código
}
```

### 2.2 Mostrar alerta no cliente

**Arquivo:** `src/app/(dashboard)/atendimento/consultas/consultas-client.tsx`

```typescript
const handleCriarConsulta = async () => {
  if (!pacienteId || !especialidadeId) {
    toast.error("Preencha paciente e especialidade");
    return;
  }

  setSubmitting(true);
  try {
    const resultado = await iniciarConsulta({
      pacienteId: Number(pacienteId),
      especialidadeId: Number(especialidadeId),
      consultorioId: consultorioId ? Number(consultorioId) : undefined,
      motivo: motivo || undefined,
      prioridade: prioridade,
    });

    toast.success(`Consulta criada: ${resultado.senha}`);
    setUltimaFicha({
      senha: resultado.senha,
      paciente: selectedPaciente?.nome || "",
      especialidade: especialidades.find(e => e.id === Number(especialidadeId))?.nome || "",
      prioridade: prioridade,
    });
    setCriarOpen(false);
    resetCriar();
  } catch (error: any) {
    // ✅ NOVO: Tratamento específico de erro
    if (error.message.includes("Consultório ocupado")) {
      toast.error("❌ " + error.message);
    } else {
      toast.error("Erro: " + error.message);
    }
  } finally {
    setSubmitting(false);
  }
};
```

---

## 3. Implementação: Confirmação de Ações Críticas

### 3.1 Criar componente de diálogo de confirmação

**Arquivo:** `src/features/atendimento/components/dialog-confirmacao.tsx`

```typescript
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DialogConfirmacaoProps {
  open: boolean;
  title: string;
  description: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
}

export function DialogConfirmacao({
  open,
  title,
  description,
  destructive = false,
  onConfirm,
  onCancel,
  isLoading = false,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
}: DialogConfirmacaoProps) {
  return (
    <AlertDialog open={open} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={destructive ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {isLoading ? "Processando..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### 3.2 Integrar em consultas-client.tsx

```typescript
const [confirmarConcluir, setConfirmarConcluir] = useState<ConsultaAtendimento | null>(null);

const handleConcluirConsulta = async (atendimento: ConsultaAtendimento) => {
  setSubmitting(true);
  try {
    await concluirConsulta({
      atendimentoId: atendimento.id,
      diagnostico: diagnostico,
      prescricao: prescricao,
      observacoes: observacoes,
    });
    toast.success("Consulta concluída");
    setConfirmarConcluir(null);
    router.refresh();
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    setSubmitting(false);
  }
};

// No JSX:
{confirmarConcluir && (
  <DialogConfirmacao
    open={!!confirmarConcluir}
    title="Concluir Consulta"
    description={`Tem certeza que deseja concluir a consulta de ${confirmarConcluir.paciente.nome}?`}
    destructive={false}
    onConfirm={() => handleConcluirConsulta(confirmarConcluir)}
    onCancel={() => setConfirmarConcluir(null)}
    isLoading={submitting}
    confirmText="Sim, concluir"
  />
)}

// No botão:
<Button
  onClick={() => setConfirmarConcluir(atendimento)}
  disabled={atendimento.estado !== "EM_ATENDIMENTO"}
>
  Concluir
</Button>
```

---

## 4. Implementação: Cancelamento de Atendimento

### 4.1 Atualizar schema Prisma

**Arquivo:** `prisma/schema.prisma`

```prisma
// Adicionar antes de model Atendimento
model CancelamentoAtendimento {
  id              Int       @id @default(autoincrement())
  atendimentoId   Int       @unique @map("atendimento_id")
  motivo          String    // "nao_compareceu" | "solicitacao_paciente" | "medico_indisponivel" | "erro_administrativo" | "outro"
  justificativa   String?
  canceladoPorId  Int?      @map("cancelado_por_id")
  canceladoEm     DateTime  @default(now()) @map("cancelado_em")

  atendimento   Atendimento @relation(fields: [atendimentoId], references: [id], onDelete: Cascade)
  canceladoPor  Utilizador? @relation("CancelamentosAtendimento", fields: [canceladoPorId], references: [id])

  @@index([atendimentoId])
  @@index([canceladoEm])
  @@map("cancelamentos_atendimento")
}

// Atualizar model Utilizador (adicionar esta linha)
cancelamentosAtendimento CancelamentoAtendimento[] @relation("CancelamentosAtendimento")

// Atualizar model Atendimento (adicionar esta linha)
cancelamento CancelamentoAtendimento?
```

### 4.2 Executar migração

```bash
npx prisma migrate dev --name add_cancelamento_atendimento
```

### 4.3 Adicionar action

**Arquivo:** `src/server/actions/atendimento-actions.ts`

```typescript
export async function cancelarAtendimento(input: {
  atendimentoId: number;
  motivo: string;
  justificativa?: string;
}) {
  const usuario = await autorizar("atendimento", "editar");
  const canceladoPorId = usuario.userId ? Number(usuario.userId) : null;

  const atendimento = await prisma.atendimento.findUnique({
    where: { id: input.atendimentoId },
    include: {
      paciente: { select: { id: true, nome: true } },
      filaAtendimento: true,
      senha: true,
    },
  });

  if (!atendimento) throw new Error("Atendimento não encontrado");

  if (atendimento.estado === "CANCELADO" || atendimento.estado === "CONCLUIDO") {
    throw new Error("Não é possível cancelar este atendimento");
  }

  await prisma.$transaction(async (tx) => {
    // Criar registro de cancelamento
    await tx.cancelamentoAtendimento.create({
      data: {
        atendimentoId: input.atendimentoId,
        motivo: input.motivo,
        justificativa: input.justificativa || null,
        canceladoPorId,
      },
    });

    // Atualizar estado do atendimento
    await tx.atendimento.update({
      where: { id: input.atendimentoId },
      data: { estado: "CANCELADO" },
    });

    // Remover da fila
    if (atendimento.filaAtendimento) {
      await tx.filaAtendimento.update({
        where: { id: atendimento.filaAtendimento.id },
        data: { status: "CANCELADO" },
      });
    }

    // Cancelar senha
    if (atendimento.senha) {
      await tx.senhaAtendimento.update({
        where: { id: atendimento.senha.id },
        data: { status: "CANCELADA" },
      });
    }
  });

  await registarHistorico({
    acao: "CANCELAMENTO",
    entidade: "ATENDIMENTO",
    entidadeId: input.atendimentoId,
    descricao: `Atendimento cancelado: ${input.motivo}. ${input.justificativa || ""}`,
    pacienteId: atendimento.pacienteId,
  });

  revalidatePath("/atendimento");
  revalidatePath("/atendimento/consultas");
  revalidatePath("/atendimento/urgencias");
}
```

### 4.4 Integrar no cliente

```typescript
// No consultas-client.tsx ou urgencias-client.tsx
const [cancelarOpen, setCancelarOpen] = useState<ConsultaAtendimento | null>(null);
const [motivoCancelamento, setMotivoCancelamento] = useState("");
const [justificativa, setJustificativa] = useState("");

const handleCancelar = async () => {
  if (!motivoCancelamento) {
    toast.error("Selecione um motivo");
    return;
  }

  setSubmitting(true);
  try {
    await cancelarAtendimento({
      atendimentoId: cancelarOpen!.id,
      motivo: motivoCancelamento,
      justificativa: justificativa || undefined,
    });
    toast.success("Atendimento cancelado");
    setCancelarOpen(null);
    router.refresh();
  } catch (error: any) {
    toast.error(error.message);
  } finally {
    setSubmitting(false);
  }
};

// No JSX:
<DialogConfirmacao
  open={!!cancelarOpen}
  title="Cancelar Atendimento"
  description={`Deseja cancelar o atendimento de ${cancelarOpen?.paciente.nome}?`}
  onConfirm={handleCancelar}
  onCancel={() => setCancelarOpen(null)}
  isLoading={submitting}
  destructive
>
  <Select value={motivoCancelamento} onValueChange={setMotivoCancelamento}>
    <option>Não compareceu</option>
    <option>Solicitação do paciente</option>
    <option>Médico indisponível</option>
    <option>Erro administrativo</option>
    <option>Outro</option>
  </Select>
  <textarea
    placeholder="Justificativa (opcional)"
    value={justificativa}
    onChange={(e) => setJustificativa(e.target.value)}
  />
</DialogConfirmacao>
```

---

## 5. Extração de Constantes Compartilhadas

**Arquivo:** `src/features/atendimento/constants/estado-atendimento.ts`

```typescript
export const ESTADO_ATENDIMENTO = {
  AGUARDANDO: {
    label: "Aguardando",
    cor: "warning",
    icon: "Clock",
    descricao: "Paciente aguardando consulta",
  },
  EM_TRIAGEM: {
    label: "Em triagem",
    cor: "info",
    icon: "CheckCircle2",
    descricao: "Paciente sendo triado",
  },
  EM_ATENDIMENTO: {
    label: "Em atendimento",
    cor: "default",
    icon: "Activity",
    descricao: "Paciente sendo atendido",
  },
  CONCLUIDO: {
    label: "Concluído",
    cor: "success",
    icon: "CheckCircle2",
    descricao: "Atendimento concluído",
  },
  CANCELADO: {
    label: "Cancelado",
    cor: "destructive",
    icon: "X",
    descricao: "Atendimento cancelado",
  },
  ENCAMINHADO: {
    label: "Encaminhado",
    cor: "secondary",
    icon: "ArrowRightLeft",
    descricao: "Paciente encaminhado",
  },
} as const;

export const MOTIVOS_CANCELAMENTO = [
  { value: "nao_compareceu", label: "Não compareceu" },
  { value: "solicitacao_paciente", label: "Solicitação do paciente" },
  { value: "medico_indisponivel", label: "Médico indisponível" },
  { value: "erro_administrativo", label: "Erro administrativo" },
  { value: "outro", label: "Outro" },
] as const;

export type EstadoAtendimento = keyof typeof ESTADO_ATENDIMENTO;
export type MotivoCancelamento = typeof MOTIVOS_CANCELAMENTO[number]["value"];
```

---

## 📋 Checklist de Implementação

Implementar nesta ordem:

- [ ] **Sprint 1**
  - [ ] 1.1 - API de busca de pacientes
  - [ ] 1.2 - Componente SeletorPaciente
  - [ ] 1.3 - Integrar em consultas-client
  - [ ] 2.1 - Validar conflito consultório (action)
  - [ ] 2.2 - Mostrar alerta no cliente
  - [ ] 5 - Extrair constantes compartilhadas

- [ ] **Sprint 2**
  - [ ] 3.1 - Componente DialogConfirmacao
  - [ ] 3.2 - Integrar em consultas e urgências
  - [ ] 4.1-4.4 - Sistema de cancelamento completo

- [ ] **Sprint 3**
  - [ ] Testes de integração
  - [ ] Feedback de usuários
  - [ ] Performance tunning

---

## 🧪 Testes Sugeridos

```bash
# 1. Busca de pacientes
- Buscar por nome (parcial)
- Buscar por número de processo
- Buscar com termos vazios (não retornar nada)
- Paginação funciona?

# 2. Conflito consultório
- Criar consulta sem consultório (OK)
- Criar consulta com consultório vago (OK)
- Criar 2 consultas no mesmo consultório (erro na 2ª)
- Depois de concluir, consultório fica disponível

# 3. Confirmação
- Clicar "Concluir" abre diálogo
- Clicar "Cancelar" no diálogo não faz nada
- Clicar "Confirmar" executa ação
- Teste com loading state

# 4. Cancelamento
- Cancelar consulta em AGUARDANDO
- Cancelar urgência em EM_TRIAGEM
- Não permitir cancelar CONCLUIDO
- Verificar histórico foi registado
```

---

## 🚀 Próximos Passos

1. Implementar as 4 melhorias acima
2. Testar com dados reais
3. Fazer code review com equipa
4. Deploy em staging
5. UAT com utilizadores finais
6. Ajustes baseados em feedback
7. Deploy em produção

Boa sorte! 🎯
